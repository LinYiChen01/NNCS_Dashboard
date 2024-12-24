import os
from flask_bcrypt import Bcrypt
import base64, re
from datetime import datetime, timedelta
import filetype
from flask import Flask, render_template, request, abort, session, redirect, url_for, make_response, jsonify
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
import time
from authlib.integrations.flask_client import OAuth
import json
import pymysql.cursors
from linebot.v3 import (
    WebhookHandler
)
from linebot.v3.exceptions import (
    InvalidSignatureError
)
from linebot.v3.messaging import (
    Configuration,
    ApiClient,
    MessagingApi,
    ReplyMessageRequest,
    TextMessage,
    PushMessageRequest
)
from linebot.v3.webhooks import (
    MessageEvent,
    TextMessageContent
)
from linebot.models import (
    PostbackAction, 
    URIAction, 
    MessageAction, 
    TemplateSendMessage, 
    ButtonsTemplate, 
    TextMessage
)
from linebot.exceptions import InvalidSignatureError
from linebot.v3.messaging.models import TextMessage
from linebot.v3.webhooks import FollowEvent, PostbackEvent

# Access Token 和 Channel Secret
access_token = "ezTOh8SMwv3ATxslU3Wk4Bm5oAiP3cKadO+xnXZYiRNMOkl2R6w0IBuulijnc088OqwZJgjodYEcSiZO/n3mKfLVraN1GIFciPkcMANaPw4F8K1lyQKZ48SpGGp2KrxcVVQt8tu90S7R6EgIjazW9wdB04t89/1O/w1cDnyilFU="
channel_secret = "8c6f630875f7495650df8b1827587a24"

configuration = Configuration(access_token=access_token)
api_client = ApiClient(configuration=configuration)
messaging_api = MessagingApi(api_client=api_client)
handler = WebhookHandler(channel_secret)


# 資料庫連線
def get_db_connection():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='',
        db='nncs',
        cursorclass=pymysql.cursors.DictCursor)

# 圖片大小限制 (64KB)
MAX_CONTENT_LENGTH = 64 * 1024

# ------LINE Bot-------
app = Flask(__name__, static_folder='templates/assets')
@app.route("/callback", methods=['POST'])
def callback():
    # 從請求頭獲取簽名
    signature = request.headers.get('X-Line-Signature', '')
    # 從請求體獲取事件資料
    body = request.get_data(as_text=True)
    try:
        # 處理事件
        handler.handle(body, signature)
    except Exception as e:
        print(f"Error: {e}")
        abort(400)
    return 'OK'

# 連到資料庫查詢是否有這筆學號
def query_student_id(student_id):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = "SELECT * FROM students WHERE st_id = %s"
            cursor.execute(sql, (student_id,))
            result = cursor.fetchone()
            return result  # 返回查詢結果
    finally:
        connection.close()

# 檢查是否綁定
def is_user_bound(line_id):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = "SELECT st_id FROM students WHERE line_user_id = %s"
            cursor.execute(sql, (line_id,))
            result = cursor.fetchone()
            return result
    finally:
        connection.close()

# 沒有綁定舅舅新增LINE ID 到資料庫
def bind_user(line_id, student_id):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE `students` SET `line_user_id`=%s WHERE `st_id`=%s", (line_id, student_id))
            connection.commit()
    finally:
        connection.close()

# 使用者對LINE Bot 發訊息
@handler.add(MessageEvent)
def handle_message(event):
    line_id = event.source.user_id  # 使用者 Line ID
    user_message = event.message.text.strip()  # 將使用者的 ID 去除空白

    # 檢查是否綁定
    bound_user = is_user_bound(line_id)

    # 記錄使用者現在屬於哪種狀態(成功, 失敗...)
    global user_status
    if 'user_status' not in globals():
        user_status = {}

    # 初始化使用者狀態
    if line_id not in user_status:
        user_status[line_id] = {"status": 0, "student_id": None}

    # 狀態 0： "我要綁定"
    if user_status[line_id]["status"] == 0:
        if user_message == "我要綁定":
            if bound_user:
                reply_message = TextMessage(text="您已綁定，無需重複綁定!")
            else:
                reply_message = TextMessage(text="請輸入學號:")
                user_status[line_id]["status"] = 1  # 更新狀態為等待輸入學號
            reply_request = ReplyMessageRequest(
                reply_token=event.reply_token,
                messages=[reply_message]
            )
            messaging_api.reply_message(reply_request)
        else:
            # 提醒使使用者發送正確的訊息
            if bound_user:
                reply_message = TextMessage(text="很抱歉我們無法回復訊息😓")
                reply_request = ReplyMessageRequest(
                    reply_token=event.reply_token,
                    messages=[reply_message]
                )
                messaging_api.reply_message(reply_request)
            else:
                reply_message = TextMessage(text="請輸入 '我要綁定' 開始綁定流程!")
                reply_request = ReplyMessageRequest(
                    reply_token=event.reply_token,
                    messages=[reply_message]
                )
                messaging_api.reply_message(reply_request)
        return

    # 狀態 1：用戶輸入學號
    if user_status[line_id]["status"] == 1:
        if user_message.isdigit():
            connection = get_db_connection()
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT st_id FROM students WHERE st_id = %s;", (user_message,))
                    result = cursor.fetchone()
            finally:
                connection.close()

            if result:
                reply_message = TextMessage(text="請輸入手機號碼:")
                user_status[line_id]["status"] = 2  # 更新狀態為等待輸入手機號碼
                user_status[line_id]["student_id"] = user_message  # 暫存學號
            else:
                reply_message = TextMessage(text="查無學號，請重新輸入:")
        else:
            reply_message = TextMessage(text="學號格式錯誤，請重新輸入:")
        reply_request = ReplyMessageRequest(
            reply_token=event.reply_token,
            messages=[reply_message]
        )
        messaging_api.reply_message(reply_request)
        return

    # 狀態 2：用戶輸入手機號碼
    if user_status[line_id]["status"] == 2:
        if user_message.isdigit():
            phone_number = user_message
            st_id = int(user_status[line_id]["student_id"])

            connection = get_db_connection()
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT user_id FROM users WHERE user_id = %s AND (phone1 = %s OR phone2 = %s);",
                        (st_id, phone_number, phone_number)
                    )
                    result = cursor.fetchone()
            finally:
                connection.close()

            if result:
                bind_user(line_id, st_id)
                reply_message = TextMessage(text="綁定成功！")
            else:
                reply_message = TextMessage(text="綁定失敗，請確認手機號碼!")
            user_status[line_id]["status"] = 0  # 重置狀態
        else:
            reply_message = TextMessage(text="手機號碼格式錯誤，請重新輸入:")
        reply_request = ReplyMessageRequest(
            reply_token=event.reply_token,
            messages=[reply_message]
        )
        messaging_api.reply_message(reply_request)
        return

    # 預設情況：未處理的狀態或消息
    reply_message = TextMessage(text="操作失敗，請重新輸入 '我要綁定' 重新開始流程。")
    user_status[line_id]["status"] = 0  # 重置狀態
    reply_request = ReplyMessageRequest(
        reply_token=event.reply_token,
        messages=[reply_message]
    )
    messaging_api.reply_message(reply_request)

# 找到明天要上課的學生 Line ID
def get_tomorrow_classes():
    # tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            query = """
                SELECT s.line_user_id 
                FROM `attend` a 
                JOIN students s ON s.st_id = a.user_id 
                WHERE a.class_date = %s AND a.status = '';
            """
            # cursor.execute(query, (tomorrow,))
            cursor.execute(query, ('2024-11-26',))
            
            results = cursor.fetchall()
        return [row["line_user_id"] for row in results if row["line_user_id"] != '']
    finally:
        connection.close()

# 發送通知給學生
def send_class_reminders(line_ids):
    for line_id in line_ids:
        try:
            message = TextMessage(text="提醒您😊明天有課，請記得準時上課喔！\n無法到課記得在明天前請假，否則會登記為曠課!")
            push_request = PushMessageRequest(to=line_id, messages=[message])
            messaging_api.push_message(push_request)
            print(f"通知已發送給用戶 {line_id}")
        except Exception as e:
            print(f"發送消息給 {line_id} 時出錯：{e}")
# ------LINE Bot-------

# 自動執行LINE Bot上課通知訊息發送
def scheduled_task():
    # 開始執行時間
    start_time = time.time()
    print(f"開始執行... {datetime.now()}")
    # 找到明天要上課的學生 Line ID
    line_ids = get_tomorrow_classes()
    # 發送通知給學生
    send_class_reminders(line_ids)
    # 結束執行時間
    end_time = time.time()
    execution_time = end_time - start_time
    print(f"結束執行 花費: {execution_time:.2f}秒")

scheduler = BackgroundScheduler()
# scheduler.add_job(scheduled_task, IntervalTrigger(seconds=10)) # 10秒執行
scheduler.add_job(scheduled_task, CronTrigger(hour=19, minute=25)) # 19:25自動發送訊息


app.secret_key = os.urandom(24)  # 隨機生成一個24位元組的金鑰
bcrypt = Bcrypt(app)


# ------學生------

# index 首頁 我的課表
@app.route("/")
@app.route('/index', methods=['GET', 'POST'])
def index():
    login_status = session.get('login_status')
    role = session.get('role')
    user_id = session.get('user_id')
    class_num = 0  # 已上課堂數
    sc_class_num = 0 # 總選課堂數
    border_color = ""
    text_color = ""

    if login_status == "True" and  role == '1':
        connection = get_db_connection()

        with connection.cursor() as cursor:
            sql = "SELECT name FROM courses"
            cursor.execute(sql)
            courses = cursor.fetchall()

        with connection.cursor() as cursor:
            sql = """
            SELECT
                classtime.classtime_id,
                classroom.name,
                classtime.class_week,
                classtime.start_time,
                classtime.end_time
            FROM
                classtime
            JOIN
                classroom ON classtime.classroom_id = classroom.classroom_id
            ORDER BY
                classroom.name ASC,
                FIELD(classtime.class_week, '一', '二', '三', '四', '五', '六', '日'),
                classtime.start_time ASC;
            """
            cursor.execute(sql)
            result = cursor.fetchall()

            classroom_data = []
            classroom = []
            classroom_area = []
            class_week = []
            start_time = []
            end_time = []
            
            for i in result:
                cursor.execute("""
                               SELECT t.tr_id, tc.course_id, u.name 
                               FROM `teachers` t JOIN tr_course tc 
                               ON tc.user_id = t.user_id 
                               JOIN users u 
                               ON u.user_id = t.user_id 
                               WHERE classtime_id=%s;""", 
                               i['classtime_id'])
                result2 = cursor.fetchall()
                tr_data = []
                for j in result2:
                    tr_data.append({
                        'tr_id': j['tr_id'],
                        'tr_name': j['name'],
                        'tr_course': j['course_id']
                    })
                classroom_data.append({
                    'classtime_id' : i['classtime_id'],
                    'classroom' : i['name'],
                    'class_week' : i['class_week'],
                    'start_time' : str(i['start_time'])[:-3],
                    'end_time' : str(i['end_time'])[:-3],
                    'trs': tr_data
                })
                
                classroom.append(i['name'])
                classroom_area.append(i['name'][:2])
                class_week.append(i['class_week'])
                start_time.append(str(i['start_time'])[:-3])
                end_time.append(str(i['end_time'])[:-3])
            
            classroom_area = sorted(set(classroom_area))

        with connection.cursor() as cursor:
            sql = "SELECT * FROM users WHERE user_id = %s"
            cursor.execute(sql, (user_id))
            result = cursor.fetchone()
            name= result['name']
            picture_data = result['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime

            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT course_id FROM students WHERE st_id = %s;", (user_id,))
            result = cursor.fetchone()
        course_id = result['course_id']

        # 查詢用戶的參加課程信息
        with connection.cursor() as cursor:
            cursor.execute("SELECT attend_id, classtime_id, class_date, status FROM attend WHERE user_id=%s", (user_id,))
            attendances = cursor.fetchall()

        event_data = []
        start_class_date = []

        # 查詢每個參加課程的詳細信息
        for attendance in attendances:
            fc_attend_id = attendance['attend_id']
            fc_classtime_id = attendance['classtime_id']
            fc_class_date = attendance['class_date']
            fc_status = attendance['status']
            start_class_date.append(attendance['class_date'])

            # 曠課(3) -> 紅色
            if fc_status == '3':
                border_color = "#ef6767"
                text_color = '#ef6767'
                class_num += 1
                sc_class_num += 1
            # '' -> 藍色
            elif fc_status == '':
                border_color = "#6777ef"
                text_color = '#6777ef'
                sc_class_num += 1
            # 上課(1) -> 藍色
            elif fc_status == '1':
                border_color = "#aaadbf"
                text_color = '#aaadbf'
                class_num += 1
                sc_class_num += 1
            # 停課(4) -> 綠色
            elif fc_status == '4':
                border_color = "#8bb690"
                text_color = '#8bb690'
            # 請假(2) -> 橘色
            elif fc_status == '2':
                border_color = "#f8ac50"
                text_color = '#f8ac50'
            with connection.cursor() as cursor:
                cursor.execute("SELECT classroom_name, start_time, end_time FROM classroom_schedule WHERE classtime_id=%s", (fc_classtime_id,))
                result = cursor.fetchone()
                fc_classroom_name = result['classroom_name']
                fc_start_time = str(result['start_time'])[:-3]
                fc_end_time = str(result['end_time'])[:-3]

                # 構建日曆事件數據
                event_data.append({
                    'attend_id': fc_attend_id,
                    'status': fc_status,
                    'title': fc_classroom_name + "\n" + fc_start_time + '-' + fc_end_time,
                    'start': fc_class_date,  # 日期
                    'end': fc_class_date,
                    'allDay': True,  # 整天事件
                        'borderColor': border_color,
                        'backgroundColor': "#fff",
                        'textColor': text_color
                })

        start_class_date = min(start_class_date)
        end_class_date = start_class_date + timedelta(days=168)

        
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM `classroom_attend_view`;")
            result = cursor.fetchall()

        classroom_attend_data = []
        for i in  result:
            # 額滿
            if i['st_num'] == i['tr_max_st'] or  i['st_num'] == i['classroom_max_st']:
                classroom_attend_data.append({
                    'class_date': i['class_date'].strftime('%Y-%m-%d'),
                    'classtime_id': i['classtime_id'],
                })
        connection.close()
        return render_template("index.html", **locals())
    else:
        return redirect(url_for('login'))

# fc_leaveButton 學生單堂請假、退選
@app.route("/fc_leaveButton", methods=['POST'])
def fc_leaveButton():
    user_id = session.get('user_id')
    if request.method == 'POST':
        fc_attend_id = request.form['fc_attend_id']
        fc_leavestatus = request.form['fc_leavestatus']

        connection = get_db_connection()
        if fc_leavestatus == 'saveLleave': # 單堂請假
            with connection.cursor() as cursor:
                cursor.execute("UPDATE attend SET status='2' WHERE attend_id=%s;", (fc_attend_id,))
        elif fc_leavestatus == 'dropCourse': # 退選
            with connection.cursor() as cursor:
                cursor.execute("SELECT semester, classtime_id FROM attend WHERE attend_id=%s;", (fc_attend_id,))
                result = cursor.fetchone()
                cursor.execute("DELETE FROM `attend` WHERE attend_id=%s;", (fc_attend_id))
                # semester = result['semester']
                # classtime_id = result['classtime_id']
                # cursor.execute("DELETE FROM `attend` WHERE semester=%s AND user_id=%s AND classtime_id=%s AND status='';", (semester, user_id, classtime_id,))
        
        connection.commit()
        connection.close()
            
        return redirect(url_for('index'))
    return redirect(url_for('login'))

# fc_notLeaveButton 學生取消請假
@app.route("/fc_notLeaveButton", methods=['POST'])
def fc_notLeaveButton():
    if request.method == 'POST':
        fc_leaveDayDate = request.form['fc_notLeaveDayDate']
        fc_attend_id = request.form['fc_notAttend_id']

        # 連接到資料庫
        connection = get_db_connection()
        with connection.cursor() as cursor:

            # 查詢該日期和時段的上課人數
            cursor.execute("""
                SELECT COUNT(attend_id) as attend_count 
                FROM attend
                WHERE class_date = %s AND classtime_id = (SELECT classtime_id FROM attend WHERE attend_id = %s)
            """, (fc_leaveDayDate, fc_attend_id))

            result = cursor.fetchone()
            attend_count = result['attend_count']
            if attend_count > 19:
                # 如果人數已滿，返回狀態
                return jsonify({'status': 'full'})

            # 如果人數未滿，更新記錄為上課狀態
            cursor.execute("""
                UPDATE attend
                SET status = ''
                WHERE attend_id = %s
            """, (fc_attend_id,))
            connection.commit()

            # 返回更新成功的狀態
            return jsonify({'status': 'success'})
   
# 學習進度
@app.route('/st_note', methods=['GET', 'POST'])
def st_note():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '1':
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id))
            result = cursor.fetchone()
            name= result['name']
            picture_data = result['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime

            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

        st_note = []
        note_todo = []
        course_data = []
        with connection.cursor() as cursor:
            cursor.execute("""
                            SELECT s.* ,c.class_week, c.start_time, c.end_time, cr.name, co.name as course_name
                            FROM `stprogress` s
                            JOIN classtime c
                            ON s.classtime_id = c.classtime_id
                            JOIN classroom cr
                            ON cr.classroom_id = c.classroom_id
                            JOIN courses co
                            ON co.course_id = s.course_id
                            WHERE s.st_id=%s
                            """, (user_id))
            result = cursor.fetchall()
            for i in result:
                st_note.append({
                    'st_id' : i['st_id'],
                    'class_date': i['class_date'],
                    'classtime_id' : i['classtime_id'],
                    'classroom_name' : i['name'],
                    'class_week' : i['class_week'],
                    'start_time' : str(i['start_time'])[:-3],
                    'end_time' : str(i['end_time'])[:-3],
                    'course_id' : i['course_id'],
                    'course_name' : i['course_name'],
                    'progress' : i['progress'],
                    'problems': i['problems'],
                })
            
            cursor.execute("""
                            SELECT 
                                a.*, cr.name AS classroom_name, c.class_week, c.start_time, c.end_time 
                            FROM attend a 
                            LEFT JOIN stprogress s ON a.user_id = s.st_id AND a.class_date = s.class_date 
                            JOIN classtime c ON c.classtime_id = a.classtime_id 
                            JOIN classroom cr ON cr.classroom_id = c.classroom_id 
                            WHERE a.status = "1" AND s.st_id IS NULL AND a.user_id=%s;
                        """, (user_id))
            result = cursor.fetchall()
            for i in result:
                note_todo.append({
                    'classtime_id' : i['classtime_id'],
                    'class_date': i['class_date'],
                    'class_schedule': str(i['classroom_name'] + " 禮拜" + i['class_week'] + " " + str(i['start_time'])[:-3] + "-" + str(i['end_time'])[:-3])
                })
            cursor.execute("SELECT course_id, name FROM `courses`;")
            result = cursor.fetchall()
            for i in result:
                course_data.append({
                    'course_id': i['course_id'],
                    'course_name': i['name']
                })
            
        return render_template("st_note.html", **locals())
    else:
        return redirect(url_for('login'))

# editNoteButton 學生填寫學習進度
@app.route('/editNoteButton', methods=['POST'])
def editNoteButton():
    if request.method == 'POST':
        st_id = request.form['st_id']
        st_classtime_id, st_class_date = request.form['st_note_classtime'].split()
        st_course_id = int(request.form['st_note_course_id'])
        st_progress = int(request.form['st_note_last_problems'])
        st_problems = int(request.form['st_note_problems'])
        
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO `stprogress`(`st_id`, `classtime_id`, `course_id`, `progress`, `class_date`, `problems`) VALUES (%s, %s, %s, %s, %s, %s)", 
                           (st_id, st_classtime_id, st_course_id, st_progress, st_class_date, st_problems))
            connection.commit()
        return redirect(url_for('st_note'))
    else:
        return redirect(url_for('login'))

# profiles 個人檔案(學生)
@app.route("/profiles")
def profiles():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '1':
        connection = get_db_connection()
        
        # 查user資料
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id,))
            result = cursor.fetchone()
            
        name = result['name']
        address = result['address']
        phone1 = result['phone1']
        phone2 = result['phone2']
        email = result['email']
        role = result['role']
        if role == '1':
            role = '學生'
        elif role == '3':
            role = '老師'
        elif role == '4':
            role = '管理員' 
        picture_data = result['picture']

        # 查students資料
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM students WHERE st_id = %s;", (user_id))
            result = cursor.fetchone()
        workplace = result['workplace']
        profession = result['profession']
        course_id = result['course_id']

        # 查course_id 對應的course_name
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM courses WHERE course_id = %s;", (course_id))
            result = cursor.fetchone()
        course_name = result['name']

        # 確定圖片的 MIME 類型
        kind = filetype.guess(picture_data)
        mime_type = kind.mime
        # 將二進制數據編碼為 Base64 字串
        encoded_img = base64.b64encode(picture_data).decode('utf-8')
        # 構建適用於前端的 Base64 數據 URL
        picture = f"data:{mime_type};base64,{encoded_img}"

        with connection.cursor() as cursor:
            cursor.execute("SELECT semester FROM `attend` WHERE user_id=%s AND status= '' ORDER BY `semester` ASC LIMIT 1;", (user_id))
            # connection.commit()  # 確保插入操作被提交
            result = cursor.fetchone()
            semester = result['semester']
            print(semester, 'semester')

            # 總共請假幾次
            cursor.execute("SELECT count(attend_id) as leave_num FROM `attend` WHERE user_id=%s AND semester=%s AND status='2'", (user_id, semester))
            result = cursor.fetchone()
            leave_num = result['leave_num']

            # 總共上了多少課(含曠課)
            cursor.execute("SELECT count(attend_id) as class_num FROM `attend` WHERE user_id=%s AND semester=%s AND (status='1' OR status='3')", (user_id, semester))
            result = cursor.fetchone()
            class_num = result['class_num']

            # 找出這學期第一次上課的日期 去計算結束日期
            cursor.execute("SELECT class_date FROM `attend` WHERE user_id=%s AND semester=%s  ORDER BY class_date ASC LIMIT 1;", (user_id, semester))
            result = cursor.fetchone()
            start_class_date = result['class_date']
            end_class_date = start_class_date + timedelta(days=168)
        
            attend_data = []
            cursor.execute("SELECT * FROM `attend_view` WHERE st_id=%s AND semester=%s AND status != '' ORDER BY class_date ASC;", (user_id, semester))
            result = cursor.fetchall()
        
        for i in result:
            if i['status'] == '1':
                i['status'] = '上課'
            elif i['status'] == '2':
                i['status'] = '請假'
            elif i['status'] == '3':
                i['status'] = '曠課'
            elif i['status'] == '4':
                i['status'] = '停課'
            
            attend_data.append(
                {
                'class_date': i['class_date'],
                'classroom_name': i['classroom_name'],
                'start_time': str(i['start_time'])[:-3],
                'end_time': str(i['end_time'])[:-3],
                'status': i['status'] 
                }
            )
            print(attend_data, 'l;l;l;')

        connection.close()  # 確保連接被關閉


        return render_template("profiles.html", **locals())
    
    else:
        # 未登入狀態下的處理
        return redirect(url_for('login'))

# update_profile 學生更新個人檔案
@app.route('/update_profile', methods=['POST'])
def update_profile():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '1':
        phone1 = request.form.get('phone1')
        phone2 = request.form.get('phone2')
        email = request.form.get('email')
        address = request.form.get('address')
        workplace = request.form.get('workplace')
        profession = request.form.get('profession')
        # 處理圖片
        picture = request.files.get('file')
        
        if picture.filename != '': # 有更新傳圖片
            picture = picture.read()
        else:
            # 沒有更新圖片
            match = re.match(r'data:(.*?);base64,(.*)', request.form['img_data'])
            base64_data = match.group(2)  # Base64 編碼的資料
            picture_data = base64.b64decode(base64_data)  # 解碼為二進位資料
            picture = picture_data

        # Update the users table
        connection = get_db_connection()
        cursor = connection.cursor()
        sql = "UPDATE users SET picture = %s, phone1 = %s, phone2 = %s, email = %s, address = %s WHERE user_id = %s;"
        cursor.execute(sql, (picture, phone1, phone2, email, address, user_id))
        connection.commit()

        # Update the students table
        cursor = connection.cursor()
        sql = " UPDATE students SET workplace = %s, profession = %s WHERE st_id = %s;"
        cursor.execute(sql, (workplace, profession, user_id))
        connection.commit()
        connection.close()

        return redirect(url_for('profiles'))
    else:
        return redirect(url_for('login'))

# certificate 我的證照
@app.route("/certificate")
def certificate():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    
    if login_status == "True" and  role == '1':
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "SELECT * FROM users WHERE user_id = %s"
            cursor.execute(sql, (user_id))
            result = cursor.fetchone()
            name= result['name']
            picture_data = result['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime

            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

            with connection.cursor() as cursor:
                cursor.execute("SELECT certrecord_id, cert_name, cert_program, cert_pic, cert_date, cert_status FROM cert_view WHERE user_id = %s ORDER BY `cert_date` ASC;", (user_id))
                result = cursor.fetchall()
                cert_record = []
                
                for i in result:
                    picture_data = i['cert_pic']
                    # 確定圖片的 MIME 類型
                    kind = filetype.guess(picture_data)
                    mime_type = kind.mime

                    # 將二進制數據編碼為 Base64 字串
                    encoded_img = base64.b64encode(picture_data).decode('utf-8')
                    # 構建適用於前端的 Base64 數據 URL
                    picture = f"data:{mime_type};base64,{encoded_img}"
                    cert_record.append({
                        'certrecord_id': i['certrecord_id'],
                        'cert_name': i['cert_name'],
                        'cert_program': i['cert_program'],
                        'cert_date': i['cert_date'],
                        'cert_pic': picture,
                        'cert_status': i['cert_status']
                        
                    })
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM `certs`")
                result = cursor.fetchall()
                cert_data = []
                
                for i in result:
                    cert_data.append({
                        'cert_name': i['name'],
                        'cert_program': i['program'],
                        'cert_difficulty': i['difficulty'],
                    })
                names = sorted(set(str(i['cert_name']) for i in cert_data))
                programs = sorted(set(str(i['cert_program']) for i in cert_data))
            

        return render_template("certificate.html", **locals())
    else:
        return redirect(url_for('login'))

# cert_updateDataButton 學生上傳證照
@app.route("/cert_updateDataButton", methods=['POST'])
def cert_updateDataButton():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '1':
        cert_name = request.form.get('cert_name')
        cert_program = request.form.get('cert_program')
        certDate = datetime.strptime(request.form.get('cert_date'), '%Y-%m-%d')
        picture = request.files.get('file')
        picture = picture.read()

        # Update the users table
        connection = get_db_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT cert_id FROM certs WHERE name=%s AND program=%s", (cert_name, cert_program))
                result = cursor.fetchone()
                cert_id = result['cert_id']
        except:
            with connection.cursor() as cursor:
                cursor.execute("INSERT INTO certs (name, program) VALUES (%s, %s)", (cert_name, cert_program))
                connection.commit()

                cursor.execute("SELECT cert_id FROM certs WHERE name=%s AND program=%s", (cert_name, cert_program))
                result = cursor.fetchone()
                cert_id = result['cert_id']
        
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO certrecords (user_id, cert_id, cert_pic, cert_date, status) VALUES (%s, %s, %s, %s, %s)",
                (user_id, cert_id, picture, certDate, 2)
            )
            connection.commit()

        return redirect(url_for('certificate'))
    else:
        return redirect(url_for('login'))

# cert_edit 學生重新上傳證照(未通過的時候)
@app.route("/cert_edit", methods=['POST'])
def cert_edit():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and role == '1':
        certrecord_id = request.form.get('cert_id_edit')
        cert_name = request.form.get('cert_name_edit')
        cert_program = request.form.get('cert_program_edit')
        certDate = datetime.strptime(request.form.get('cert_date_edit'), '%Y-%m-%d')
        picture = request.files.get('file_edit')

        # Establish database connection
        connection = get_db_connection()

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT cert_id FROM certs WHERE name=%s AND program=%s", (cert_name, cert_program))
                result = cursor.fetchone()

                if result:
                    cert_id = result['cert_id']
                else:
                    # If cert does not exist, create a new one
                    cursor.execute("INSERT INTO certs (name, program) VALUES (%s, %s)", (cert_name, cert_program))
                    connection.commit()

                    # Retrieve the cert_id of the newly inserted record
                    cursor.execute("SELECT cert_id FROM certs WHERE name=%s AND program=%s", (cert_name, cert_program))
                    result = cursor.fetchone()
                    cert_id = result['cert_id']

        except Exception as e:
            # Handle potential errors during cert retrieval or insertion
            print(f"Error during cert retrieval or insertion: {e}")
            connection.rollback()
            return redirect(url_for('certificate'))  # or error page

        try:
            # Update certrecord with or without the picture
            with connection.cursor() as cursor:
                if picture and picture.filename:  # Check if a picture is uploaded
                    picture_data = picture.read()
                    cursor.execute(
                        "UPDATE `certrecords` SET `cert_id`=%s, `cert_pic`=%s, `cert_date`=%s, `status`='2' WHERE `certrecord_id`=%s",
                        (cert_id, picture_data, certDate, certrecord_id)
                    )
                else:  # If no picture is uploaded, update without it
                    cursor.execute(
                        "UPDATE `certrecords` SET `cert_id`=%s, `cert_date`=%s, `status`='2' WHERE `certrecord_id`=%s",
                        (cert_id, certDate, certrecord_id)
                    )
                connection.commit()
        except Exception as e:
            # Handle update errors
            print(f"Error updating certrecord: {e}")
            connection.rollback()

        return redirect(url_for('certificate'))
    else:
        return redirect(url_for('login'))

# ------學生------



# -----老師-----

# tr_index 課堂點名
@app.route('/tr_index', methods=['GET', 'POST'])
def tr_index():
    login_status = session.get('login_status')
    role = session.get('role')
    user_id = session.get('user_id')

    if login_status == "True" and  role == '3':
        connection = get_db_connection()
        st_data = []
        today = datetime.today()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id))
            result = cursor.fetchone()
            name= result['name']
            picture_data = result['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime

            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

            cursor.execute("SELECT tr_id FROM `teachers` WHERE user_id=%s", (user_id))
            result = cursor.fetchall()
            tr_id = []
            for i in result:
                tr_id.append(i['tr_id'])

            for i in tr_id:
                cursor.execute("""SELECT 
                                        a.*, u.name AS user_name, u.age, u.phone1, u.phone2, cr.name AS classroom_name, 
                                        a.classtime_id,c.class_week, c.start_time, c.end_time, a.status, s.note, u.create_date
                                    FROM `attend` a 
                                        JOIN users u ON a.user_id = u.user_id
                                        JOIN students s ON a.user_id = s.st_id 
                                        JOIN classtime c ON c.classtime_id = a.classtime_id 
                                        JOIN classroom cr ON cr.classroom_id = c.classroom_id 
                                    WHERE a.tr_id=%s AND a.adjust=0 AND a.class_date=%s;""", 
                            (i, today))
                result = cursor.fetchall()
                for j in result:
                    if j['status'] == '1':
                        class_status = '上課'
                    elif j['status'] == '2':
                        class_status = '請假'
                    elif j['status'] == '3':
                        class_status = '曠課'
                    else:
                        class_status = ''
                    
                    st_data.append({
                        'st_id': j['user_id'],
                        'st_name': j['user_name'],
                        'st_age': j['age'],
                        'st_phone1': j['phone1'],
                        'st_phone2': j['phone2'],
                        'classroom': j['classroom_name'],
                        'classtime_id':j['classtime_id'],
                        'class_week': j['class_week'],
                        'start_time': str(j['start_time'])[:-3],
                        'end_time': str(j['start_time'])[:-3], 
                        'status': '一般',
                        'class_status': class_status,
                        'st_note': j['note'],
                        'st_create_date': j['create_date']
                    })
                cursor.execute("""SELECT 
                                        a.*, u.name AS user_name, u.age, u.phone1, u.phone2, cr.name AS classroom_name, 
                                        a.classtime_id, c.class_week, c.start_time, c.end_time, s.note, u.create_date
                                    FROM `attend` a 
                                        JOIN users u ON a.user_id = u.user_id
                                        JOIN students s ON a.user_id = s.st_id
                                        JOIN classtime c ON c.classtime_id = a.classtime_id 
                                        JOIN classroom cr ON cr.classroom_id = c.classroom_id 
                                    WHERE a.tr_id2=%s AND a.class_date=%s;""", 
                            (i, today))
                result = cursor.fetchall()
                for j in result:
                    if j['status'] == '1':
                        class_status = '上課'
                    elif j['status'] == '2':
                        class_status = '請假'
                    elif j['status'] == '3':
                        class_status = '曠課'
                    else:
                        class_status = ''
                    st_data.append({
                        'st_id': j['user_id'],
                        'st_name': j['user_name'],
                        'st_age': j['age'],
                        'st_phone1': j['phone1'],
                        'st_phone2': j['phone2'],
                        'classroom': j['classroom_name'],
                        'classtime_id':j['classtime_id'],
                        'class_week': j['class_week'],
                        'start_time': str(j['start_time'])[:-3],
                        'end_time': str(j['start_time'])[:-3], 
                        'status': '調課',
                        'class_status': class_status,
                        'st_note': j['note'],
                        'st_create_date': j['create_date']
                    })
                classtimes = dict()
                for i in st_data:
                    classtimes[i['classtime_id']] = str(i['classroom'] + ' 禮拜' + i['class_week'] + i['start_time'] + "-" + i['end_time'])
                for i in st_data:
                    cursor.execute("SELECT picture FROM users WHERE user_id = %s;", (i['st_id']))
                    result = cursor.fetchone()
                    picture_data = result['picture']
                    # 確定圖片的 MIME 類型
                    kind = filetype.guess(picture_data)
                    mime_type = kind.mime
                    # 將二進制數據編碼為 Base64 字串
                    encoded_img = base64.b64encode(picture_data).decode('utf-8')
                    # 構建適用於前端的 Base64 數據 URL
                    picture = f"data:{mime_type};base64,{encoded_img}"
                    i['picture'] = picture
                    cursor.execute("SELECT MAX(class_date) AS last_date FROM attend WHERE (class_date < %s OR (class_date = %s AND classtime_id !=%s)) AND user_id=%s AND status=1;",
                                    (today, today, i['classtime_id'], i['st_id']))
                    result = cursor.fetchone()
                    last_date = result['last_date']
                    if last_date:
                        cursor.execute(""" 
                                    SELECT c.name, s.progress
                                                FROM `stprogress` s
                                                JOIN courses c
                                                ON c.course_id = s.course_id
                                                WHERE s.st_id=%s AND s.classtime_id=%s AND s.class_date=%s;
                                        """, 
                                        (i['st_id'], i['classtime_id'], last_date))
                        result = cursor.fetchone()
                        i['course_name'] = result['name']
                        i['course_progress'] = result['progress']
                        
        return render_template("tr_index.html", **locals())
    else:
        return redirect(url_for('login'))

# tr_rollcall 老師送出點名紀錄
@app.route('/tr_rollcall', methods=['POST'])
def tr_rollcall():
    if request.method == 'POST':
        rollcall = json.loads(request.form['rollcall'])
        rollcall_date = request.form['rollcall_date']
        connection = get_db_connection()
        with connection.cursor() as cursor:
            for st_id, v in rollcall.items():
                cursor.execute("UPDATE `attend` SET `status`=%s WHERE `user_id`=%s AND `class_date`=%s AND `classtime_id`=%s;",
                                (v['status'], st_id, rollcall_date, v['classtime_id']))
                connection.commit()
        return redirect(url_for('tr_index'))
    else:
        return redirect(url_for('login'))

# choose_st_schedule 老師點擊日曆去查看該日學生
@app.route('/choose_st_schedule', methods=['POST'])
def choose_st_schedule():
    date = request.json.get('selected_date')
    tr_id = request.json.get('tr_id')
    print('tr_id', tr_id)
    try:
        st_data = []
        connection = get_db_connection()
        with connection.cursor() as cursor:
            for i in tr_id:
                cursor.execute("""
                               SELECT 
                                    a.*, u.name AS user_name, u.age, u.phone1, u.phone2, cr.name AS classroom_name, 
                                    a.classtime_id,c.class_week, c.start_time, c.end_time, a.status, s.note, u.create_date
                                FROM `attend` a 
                                    JOIN users u ON a.user_id = u.user_id
                                    JOIN students s ON a.user_id = s.st_id 
                                    JOIN classtime c ON c.classtime_id = a.classtime_id 
                                    JOIN classroom cr ON cr.classroom_id = c.classroom_id 
                                WHERE a.tr_id=%s AND a.adjust=0 AND a.class_date=%s;""", 
                                (i, date))
                print(i, date, 'yuhjkjh,k')
                result = cursor.fetchall()
                for j in result:
                    if j['status'] == '1':
                        class_status = '上課'
                    elif j['status'] == '2':
                        class_status = '請假'
                    elif j['status'] == '3':
                        class_status = '曠課'
                    else:
                        class_status = ''
                    
                    st_data.append({
                        'st_id': j['user_id'],
                        'st_name': j['user_name'],
                        'st_age': j['age'],
                        'st_phone1': j['phone1'],
                        'st_phone2': j['phone2'],
                        'classroom': j['classroom_name'],
                        'classtime_id':j['classtime_id'],
                        'class_week': j['class_week'],
                        'start_time': str(j['start_time'])[:-3],
                        'end_time': str(j['start_time'])[:-3], 
                        'status': '一般',
                        'class_status': class_status,
                        'st_note': j['note'],
                        'st_create_date': j['create_date']
                    })
                    print(st_data, 'klklkl')
                cursor.execute("""SELECT 
                                        a.*, u.name AS user_name, u.age, u.phone1, u.phone2, cr.name AS classroom_name, 
                                        a.classtime_id, c.class_week, c.start_time, c.end_time, s.note, u.create_date
                                    FROM `attend` a 
                                        JOIN users u ON a.user_id = u.user_id
                                        JOIN students s ON a.user_id = s.st_id
                                        JOIN classtime c ON c.classtime_id = a.classtime_id 
                                        JOIN classroom cr ON cr.classroom_id = c.classroom_id 
                                    WHERE a.tr_id2=%s AND a.class_date=%s;""", 
                            (i, date))
                result = cursor.fetchall()
                for j in result:
                    if j['status'] == '1':
                        class_status = '上課'
                    elif j['status'] == '2':
                        class_status = '請假'
                    elif j['status'] == '3':
                        class_status = '曠課'
                    else:
                        class_status = ''
                    st_data.append({
                        'st_id': j['user_id'],
                        'st_name': j['user_name'],
                        'st_age': j['age'],
                        'st_phone1': j['phone1'],
                        'st_phone2': j['phone2'],
                        'classroom': j['classroom_name'],
                        'classtime_id':j['classtime_id'],
                        'class_week': j['class_week'],
                        'start_time': str(j['start_time'])[:-3],
                        'end_time': str(j['start_time'])[:-3], 
                        'status': '調課',
                        'class_status': class_status,
                        'st_note': j['note'],
                        'st_create_date': j['create_date']
                    })
                classtimes = dict()
                for i in st_data:
                    classtimes[i['classtime_id']] = str(i['classroom'] + ' 禮拜' + i['class_week'] + i['start_time'] + "-" + i['end_time'])
                for i in st_data:
                    cursor.execute("SELECT picture FROM users WHERE user_id = %s;", (i['st_id']))
                    result = cursor.fetchone()
                    picture_data = result['picture']
                    # 確定圖片的 MIME 類型
                    kind = filetype.guess(picture_data)
                    mime_type = kind.mime
                    # 將二進制數據編碼為 Base64 字串
                    encoded_img = base64.b64encode(picture_data).decode('utf-8')
                    # 構建適用於前端的 Base64 數據 URL
                    picture = f"data:{mime_type};base64,{encoded_img}"
                    i['picture'] = picture
                    cursor.execute("SELECT MAX(class_date) AS last_date FROM attend WHERE (class_date < %s OR (class_date = %s AND classtime_id !=%s)) AND user_id=%s AND status=1;",
                                    (date, date, i['classtime_id'], i['st_id']))
                    
                    result = cursor.fetchone()
                    last_date = result['last_date']
                    if last_date:
                        try:
                            cursor.execute(""" 
                                            SELECT c.name, s.progress
                                            FROM `stprogress` s
                                            JOIN courses c
                                            ON c.course_id = s.course_id
                                            WHERE s.st_id=%s AND s.classtime_id=%s AND s.class_date<=%s
                                            ORDER BY s.class_date DESC LIMIT 1;
                                            """, 
                                            (i['st_id'], i['classtime_id'], last_date))
                            result = cursor.fetchone()
                            i['course_name'] = result['name']
                            i['course_progress'] = result['progress']
                        except:
                            i['course_name'] = '-'
                            i['course_progress'] = ''
        if len(st_data) !=0:
            return jsonify({"st_data": st_data, "classtimes": classtimes})

        else:
            print('123111')
            return jsonify("查無資料")          
    except Exception as e:
        print(f"Error occurred: {e}")  # 打印具体的异常信息
        return jsonify('查無資料')    

# st_info 老師查看學生的詳細資料
@app.route('/st_info', methods=['POST'])
def st_info():
    if request.method == 'POST':
        st_id = request.form['st_info_input_edit']
        note = request.form['st_info_note']

        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("UPDATE `students` SET `note`=%s WHERE st_id =%s;", (note, st_id))
            connection.commit()
        return redirect(url_for('tr_index'))
    else:
        return redirect(url_for('login'))

# tr_profiles 個人檔案(老師)
@app.route("/tr_profiles")
def tr_profiles():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '3':
        connection = get_db_connection()
        
        # 查user資料
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id,))
            result = cursor.fetchone()
            
        name = result['name']
        address = result['address']
        phone1 = result['phone1']
        phone2 = result['phone2']
        email = result['email']
        role = result['role']
        if role == '1':
            role = '學生'
        elif role == '3':
            role = '老師'
        elif role == '4':
            role = '管理員' 
        picture_data = result['picture']

        # 確定圖片的 MIME 類型
        kind = filetype.guess(picture_data)
        mime_type = kind.mime
        # 將二進制數據編碼為 Base64 字串
        encoded_img = base64.b64encode(picture_data).decode('utf-8')
        # 構建適用於前端的 Base64 數據 URL
        picture = f"data:{mime_type};base64,{encoded_img}"

        # 查teacher資料
        with connection.cursor() as cursor:
            cursor.execute("""
                           SELECT t.classtime_id, cr.name, c.class_week, c.start_time, c.end_time, t.st_num 
                           FROM `teachers` t 
                           JOIN classtime c ON c.classtime_id = t.classtime_id 
                           JOIN classroom cr ON cr.classroom_id = c.classroom_id 
                           WHERE t.user_id=%s;""", (user_id))
            result = cursor.fetchall()

            tr_schedule = dict()
            for i in result:
                tr_schedule[i['classtime_id']] = {
                    "classroom_name": i['name'],
                    "class_week": i['class_week'],
                    "start_time": str(i['start_time'])[:-3],
                    "end_time":  str(i['end_time'])[:-3],
                    "st_num": i['st_num']
                }

            tr_course = dict()
            cursor.execute("""
                            SELECT t.course_id, c.name
                            FROM `tr_course` t
                            JOIN courses c
                            ON c.course_id = t.course_id
                            WHERE t.user_id=%s;""", (user_id))
            result = cursor.fetchall()
            for i in result:
                tr_course[i['course_id']] = {'name': i['name']}
            course_data = []
            cursor.execute("SELECT name FROM `courses` WHERE course_id < 10;")
            result = cursor.fetchall()
            for i in result:
                course_data.append(i)

        return render_template("tr_profiles.html", **locals())
    
    else:
        # 未登入狀態下的處理
        return redirect(url_for('login'))

# update_tr_profile 老師更新個人檔案
@app.route('/update_tr_profile', methods=['POST'])
def update_tr_profile():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '3':
        phone1 = request.form.get('tr_phone1')
        phone2 = request.form.get('tr_phone2')
        email = request.form.get('tr_email')
        address = request.form.get('tr_address')
        # 處理圖片
        picture = request.files.get('tr_file')
        
        if picture.filename != '': # 有更新傳圖片
            picture = picture.read()
        else:
            # 沒有更新圖片
            match = re.match(r'data:(.*?);base64,(.*)', request.form['tr_img_dataf'])
            base64_data = match.group(2)  # Base64 編碼的資料
            picture_data = base64.b64decode(base64_data)  # 解碼為二進位資料
            picture = picture_data

        # Update the users table
        connection = get_db_connection()
        cursor = connection.cursor()
        sql = "UPDATE users SET picture = %s, phone1 = %s, phone2 = %s, email = %s, address = %s WHERE user_id = %s;"
        cursor.execute(sql, (picture, phone1, phone2, email, address, user_id))
        connection.commit()

        return redirect(url_for('tr_profiles'))
    else:
        return redirect(url_for('login'))

# -----老師-----



# -----管理員-----

# ad_index 學生資訊管理
@app.route('/ad_index', methods=['GET', 'POST'])
def ad_index():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '4':
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id))
            result = cursor.fetchone()
            name= result['name']
            picture_data = result['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime

            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

        st_data = []
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM `st_info`;")
            result = cursor.fetchall()
        for i in result:
            picture_data = i['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime
            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

            st_data.append({
                'st_id' : i['user_id'],
                'st_acc' : i['acc'],
                'st_pwd' : i['pwd'],
                'st_name' : i['name'],
                'st_age' : i['age'],
                'st_address' : i['address'],
                'st_phone1' : i['phone1'],
                'st_phone2' : i['phone2'],
                'st_email' : i['email'],
                'st_picture' : picture,
                'st_create_date' : i['create_date'],
                'st_workplace' : i['workplace'],
                'st_profession' : i['profession'],
                'st_parent' : i['parent'],
                'st_tuition' : i['tuition'],
                'st_pay_num' : i['pay_num'],
                'st_course_id' : i['course_id'],
                'st_note' : i['note'],
            })

        course_name_data = []
        with connection.cursor() as cursor:
            cursor.execute("SELECT course_id, name FROM `courses`;")
            result = cursor.fetchall()
            course_name_data = result
        

        
        return render_template("ad_index.html", **locals())
    else:
        return redirect(url_for('login'))

# st_insertDataButton 管理員新增學生資訊
@app.route('/st_insertDataButton', methods=['POST'])
def st_insertDataButton():
    if request.method == 'POST':
        name = request.form['name']
        age = request.form['age']
        acc = request.form['acc']
        pwd = request.form['pwd']
        
        email = request.form['email']
        address = request.form['address']
        tuition = request.form['tuition']
        course_id = request.form['course_id']
        parent = request.form['parent']
        phone1 = request.form['phone1']
        phone2 = request.form.get('phone2')
        workplace = request.form['workplace']
        profession = request.form['profession']
        note = request.form['note'] 

        # 加密密碼
        hashed_password = bcrypt.generate_password_hash(pwd).decode('utf-8')

        # 預設圖片
        with open('templates/assets/img/avatar/avatar-1.png', 'rb') as file:
            picture = file.read()

        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO users (name, age, acc, pwd, address, phone1, phone2, email, picture, create_date, role, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", 
                                   (name, age, acc, hashed_password, address, phone1, phone2, email, picture, datetime.today(), '1', '1'))
            
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users ORDER BY user_id DESC LIMIT 1;")
            result = cursor.fetchone()
            st_id = result['user_id']
        
        
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO students (st_id, workplace, profession, parent, tuition, pay_num, course_id, note) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
                                   (st_id, workplace, profession, parent, tuition, 0, course_id, note))
        
        connection.commit() 
        return redirect(url_for('ad_index'))
    else:
        return redirect(url_for('login'))

# editStudentButton 管理員編輯學生資訊
@app.route('/editStudentButton', methods=['GET', 'POST'])
def editStudentButton():
    if request.method == 'POST':
        st_id = request.form['st_id']
        name = request.form['st_name']
        age = request.form['st_age']
        acc = request.form['st_acc']
        pwd = request.form['st_pwd']  # The password field
        course_id = request.form['st_course_name']
        tuition = request.form['st_tuition']
        parent = request.form['st_parent']
        phone1 = request.form['st_phone1']
        phone2 = request.form.get('st_phone2')
        email = request.form['st_email']
        address = request.form['st_address']
        workplace = request.form['st_workplace']
        profession = request.form['st_profession']
        note = request.form.get('st_note')

        connection = get_db_connection()

        # If password is provided (not empty), update the password in the database
        if pwd:
            # Hash the password before storing it
            hashed_password = bcrypt.generate_password_hash(pwd).decode('utf-8')

            with connection.cursor() as cursor:
                cursor.execute("UPDATE users SET acc=%s, pwd=%s, name=%s, age=%s, address=%s, phone1=%s, phone2=%s, email=%s WHERE user_id=%s;", 
                               (acc, hashed_password, name, age, address, phone1, phone2, email, st_id))
        else:
            # If password is not provided, just update other fields
            with connection.cursor() as cursor:
                cursor.execute("UPDATE users SET acc=%s, name=%s, age=%s, address=%s, phone1=%s, phone2=%s, email=%s WHERE user_id=%s;", 
                               (acc, name, age, address, phone1, phone2, email, st_id))

        # Update student-specific fields in the 'students' table
        with connection.cursor() as cursor:
            cursor.execute("UPDATE students SET workplace=%s, profession=%s, parent=%s, tuition=%s, course_id=%s, note=%s WHERE st_id=%s;", 
                           (workplace, profession, parent, tuition, course_id, note, st_id))

        connection.commit() 
        return redirect(url_for('ad_index'))
    else:
        return redirect(url_for('login'))

# leaveStudentButton 管理員刪除學生資訊
@app.route('/leaveStudentButton', methods=['GET', 'POST'])
def leaveStudentButton():
    if request.method == 'POST':
        st_id = request.form['st_id']
        connection = get_db_connection()

        with connection.cursor() as cursor:
            cursor.execute("UPDATE users SET status=%s WHERE user_id=%s;", 
                           ("2", st_id))
            
        connection.commit() 
        return redirect(url_for('ad_index'))
    else:
        return redirect(url_for('login'))

# ad_certificate 證照管理
@app.route('/ad_certificate', methods=['GET', 'POST'])
def ad_certificate():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '4':
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id))
            result = cursor.fetchone()
            name= result['name']
            picture_data = result['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime

            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

        st_cert = []
        with connection.cursor() as cursor:
            cursor.execute("SELECT c.*, ce.name, ce.program FROM `certrecords` c JOIN certs ce ON ce.cert_id = c.cert_id;")
            result = cursor.fetchall()
        for i in result:
            picture_data = i['cert_pic']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime
            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

            st_cert.append({
                'st_id' : i['user_id'],
                'cert_id' : i['certrecord_id'],
                'cert_name' : i['name'],
                'cert_program' : i['program'],
                'cert_pic' : picture,
                'cert_date' : i['cert_date'],
                'cert_status': i['status']
                
            })
        
        return render_template("ad_certificate.html", **locals())
    else:
        return redirect(url_for('login'))

# ad_cert_check 管理員確認學生證照
@app.route('/ad_cert_check', methods=['POST'])
def ad_cert_check():
    if request.method == 'POST':
        cert_id = request.form['cert_id']
        check_result = request.form['check_result']
        connection = get_db_connection()
        with connection.cursor() as cursor:
            if check_result == "no":
                cursor.execute("UPDATE `certrecords` SET `status`='3' WHERE `certrecord_id`=%s", (cert_id))
            else:
                cursor.execute("UPDATE `certrecords` SET `status`='1' WHERE `certrecord_id`=%s", (cert_id))
            connection.commit()
        return redirect(url_for('ad_certificate'))
    else:
        return redirect(url_for('login'))

# ad_cert_delete 管理員刪除證照 讓他變成待審核
@app.route('/ad_cert_delete', methods=['POST'])
def ad_cert_delete():
    if request.method == 'POST':
        cert_id = request.form['cert_id_del']
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("UPDATE `certrecords` SET `status`='2' WHERE `certrecord_id`=%s", (cert_id))
            connection.commit()
        return redirect(url_for('ad_certificate'))
    else:
        return redirect(url_for('login'))

# st_attend 學生出席明細
@app.route('/st_attend', methods=['GET', 'POST'])
def st_attend():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '4':
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id))
            result = cursor.fetchone()
            name= result['name']
            picture_data = result['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime

            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"
            cursor.execute("SELECT user_id, name FROM `users` WHERE role=3 AND status=1;")
            result = cursor.fetchall()
            tr_data = []
            for i in result:
                tr_data.append({
                    "tr_id": i['user_id'],
                    "tr_name": i['name']
                })
            course_data = []
            cursor.execute("SELECT course_id, name FROM `courses`;")
            result = cursor.fetchall()
            for i in result:
                course_data.append({
                    "course_id": i['course_id'],
                    "course_name": i['name']
                })  
        return render_template("st_attend.html", **locals())
    else:
        return redirect(url_for('login'))

# search_st_attend 管理員搜尋學生的出席紀錄
@app.route('/search_st_attend', methods=['POST'])
def search_st_attend():
    st_id = request.json.get('data')
    attend_data = []

    if st_id:
        if st_id.isdigit():
            connection = get_db_connection()
            with connection.cursor() as cursor:
                cursor.execute("""
                               SELECT a.attend_id, a.user_id, u.name, a.tr_id, a.tr_id2, a.classtime_id, cr.name as classroom_name, 
                               c.class_week, c.start_time, c.end_time, a.status, a.adjust, a.class_date
                               FROM `attend` a 
                               JOIN users u ON u.user_id = a.user_id 
                               JOIN classtime c ON a.classtime_id = c.classtime_id 
                               JOIN classroom cr ON cr.classroom_id = c.classroom_id 
                               WHERE a.user_id=%s ORDER BY a.class_date;
                               """, (st_id))
                result = cursor.fetchall()
                for i in result:
                    if i['tr_id'] and i['adjust'] == 0:
                        tr_id = i['tr_id']
                        cursor.execute("SELECT u.name from teachers tr JOIN users u ON u.user_id = tr.user_id WHERE tr.tr_id=%s;",(tr_id))
                        result2 = cursor.fetchone()
                    else:
                        # 如果是代課老師就會使用user_id
                        tr_id = i['tr_id2']
                        cursor.execute("SELECT name FROM users WHERE user_id=%s",(tr_id))
                        result2 = cursor.fetchone()
                    

                    if i['status']:
                        if i['status'] == '1':
                            status = '上課'
                        elif i['status'] == '2':
                            status = '請假'
                        elif i['status'] == '3':
                            status = '曠課'
                    else:
                        status = ''
                    cursor.execute("""
                                   SELECT s.course_id, c.name, s.progress, s.problems 
                                   FROM `stprogress` s 
                                   JOIN courses c ON c.course_id = s.course_id 
                                   WHERE st_id=%s AND classtime_id=%s AND class_date=%s;""",(i['user_id'], i['classtime_id'], i['class_date']))
                    result3 = cursor.fetchone()
                    attend_data.append({
                        "attend_id": i['attend_id'],
                        "st_id": i['user_id'],
                        "st_name": i['name'],
                        "tr_id": tr_id,
                        "tr_name": result2['name'],
                        "classtime_id": i['classtime_id'],
                        "classroom_name": i['classroom_name'],
                        "class_week": i['class_week'],
                        "start_time": str(i['start_time'])[:-3],
                        "end_time": str(i['end_time'])[:-3],
                        "status": status,
                        "adjust": i['adjust'],
                        "class_date": i['class_date'],
                        "course_id": result3['course_id'] if result3 and result3.get('course_id') else "",
                        "course_name": result3['name'] if result3 and result3.get('name') else "",
                        "progress": result3['progress'] if result3 and result3.get('progress') else "",
                        "problems": result3['problems'] if result3 and result3.get('problems') else ""
                    })
                return jsonify({"attend_data": attend_data})

        else:
            return jsonify("學號格式錯誤!")
    else:
        return jsonify("請輸入學號!")

# editStudentAttendButton 管理員編輯學生的出席紀錄
@app.route('/editStudentAttendButton', methods=['POST'])
def editStudentAttendButton():
    if request.method == 'POST':
        st_id = int(request.json.get('st_id_attend_input'))
        attend_id = request.json.get('st_attend_id')
        tr2_id = request.json.get('st_tr2_attend')
        st_status_attend = request.json.get('st_status_attend')
        course_id = request.json.get('st_course_attend')
        st_last_problem_attend = request.json.get('st_last_problem_attend')
        st_problems_attend = request.json.get('st_problems_attend')
        st_date_attend = request.json.get('st_date_attend_input')
        st_classtime_id_attend = request.json.get('st_classtime_id_attend')
    
        attend_data = []

        connection = get_db_connection()
        with connection.cursor() as cursor:
            if tr2_id is not None:
                cursor.execute("UPDATE `attend` SET `tr_id2`=%s, `adjust`= 1 WHERE `attend_id`=%s", (tr2_id, attend_id))
                connection.commit()
            if st_status_attend is not None:
                cursor.execute("UPDATE `attend` SET `status`=%s WHERE `attend_id`=%s", (st_status_attend, attend_id))
                connection.commit()
            if course_id is not None and st_last_problem_attend is not None and st_problems_attend is not None:
                cursor.execute("UPDATE `stprogress` SET `course_id`=%s, `progress`=%s, `problems`=%s WHERE `st_id`=%s AND `class_date`=%s AND `classtime_id`=%s", 
                            (course_id, st_last_problem_attend, st_problems_attend, st_id, st_date_attend, st_classtime_id_attend))
                connection.commit()
            
            cursor.execute("""
                            SELECT a.attend_id, a.user_id, u.name, a.tr_id, a.tr_id2, a.classtime_id, cr.name as classroom_name, 
                            c.class_week, c.start_time, c.end_time, a.status, a.adjust, a.class_date
                            FROM `attend` a 
                            JOIN users u ON u.user_id = a.user_id 
                            JOIN classtime c ON a.classtime_id = c.classtime_id 
                            JOIN classroom cr ON cr.classroom_id = c.classroom_id 
                            WHERE a.user_id=%s ORDER BY a.class_date;
                            """, (st_id))
            result = cursor.fetchall()
            for i in result:
                if i['tr_id'] and i['adjust'] == 0:
                    tr_id = i['tr_id']
                    cursor.execute("SELECT u.name from teachers tr JOIN users u ON u.user_id = tr.user_id WHERE tr.tr_id=%s;",(tr_id))
                    result2 = cursor.fetchone()
                else:
                    # 如果是代課老師就會使用user_id
                    tr_id = i['tr_id2']
                    cursor.execute("SELECT name FROM users WHERE user_id=%s",(tr_id))
                    result2 = cursor.fetchone()
                

                if i['status']:
                    if i['status'] == '1':
                        status = '上課'
                    elif i['status'] == '2':
                        status = '請假'
                    elif i['status'] == '3':
                        status = '曠課'
                else:
                    status = ''
                cursor.execute("""
                                SELECT s.course_id, c.name, s.progress, s.problems 
                                FROM `stprogress` s 
                                JOIN courses c ON c.course_id = s.course_id 
                                WHERE st_id=%s AND classtime_id=%s AND class_date=%s;""",(i['user_id'], i['classtime_id'], i['class_date']))
                result3 = cursor.fetchone()
                attend_data.append({
                    "attend_id": i['attend_id'],
                    "st_id": i['user_id'],
                    "st_name": i['name'],
                    "tr_id": tr_id,
                    "tr_name": result2['name'],
                    "classtime_id": i['classtime_id'],
                    "classroom_name": i['classroom_name'],
                    "class_week": i['class_week'],
                    "start_time": str(i['start_time'])[:-3],
                    "end_time": str(i['end_time'])[:-3],
                    "status": status,
                    "adjust": i['adjust'],
                    "class_date": i['class_date'],
                    "course_id": result3['course_id'] if result3 and result3.get('course_id') else "",
                    "course_name": result3['name'] if result3 and result3.get('name') else "",
                    "progress": result3['progress'] if result3 and result3.get('progress') else "",
                    "problems": result3['problems'] if result3 and result3.get('problems') else ""
                })
            return jsonify({"attend_data": attend_data, "st_id": st_id})
            # return jsonify(attend_data)

# st_leave 封存人員管理
@app.route('/st_leave', methods=['GET', 'POST'])
def st_leave():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '4':
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id))
            result = cursor.fetchone()
            name= result['name']
            picture_data = result['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime

            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

        leave_st_data = []
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id, name, age, phone1, phone2, email FROM `users` WHERE role=1 and status=2;")
            result = cursor.fetchall()
        for i in result:
            leave_st_data.append({
                'st_id' : i['user_id'],
                'st_name' : i['name'],
                'st_age' : i['age'],
                'st_phone1' : i['phone1'],
                'st_phone2' : i['phone2'],
                'st_email' : i['email'] 
            }) 
        return render_template("st_leave.html", **locals())
    else:
        return redirect(url_for('login'))

# returnStudentButton 管理員讓休學生復學
@app.route('/returnStudentButton', methods=['POST'])
def returnStudentButton():
    if request.method == 'POST':
        st_id = request.form['st_id']
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("UPDATE `users` SET `status`='1' WHERE `user_id`=%s", (st_id))
            connection.commit()
        return redirect(url_for('st_leave'))
    else:
        return redirect(url_for('login'))

# ad_money 財務管理
@app.route('/ad_money', methods=['GET', 'POST'])
def ad_money():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '4':
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id))
            result = cursor.fetchone()
            name= result['name']
            picture_data = result['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime

            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

        st_data = []
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM `st_info`;")
            result = cursor.fetchall()
        for i in result:
            picture_data = i['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime
            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"
        
        money_record = [] 
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM `money` ORDER BY money_semester DESC, st_id ASC;")
            result = cursor.fetchall()
            for i in result:
                if i['money_way'] == 0:
                        i['money_way'] = '現金'
                else:
                    i['money_way'] = '匯款'

                if i['money_details'] == 0:
                    i['money_details'] = '學費'
                else:
                    i['money_details'] = '教材費'
                if i['money_semester'] == 0:
                    i['money_semester'] = '-'
                cursor.execute("SELECT COUNT(attend_id) as class_num FROM `attend` WHERE semester=%s AND user_id=%s AND (status = 1 or status = 3);", 
                               (i['money_semester'], i['st_id']))
                result2 = cursor.fetchone()
                money_record.append({
                    'money_id': i['money_id'],
                    'st_id': i['st_id'],
                    'money_semester': i['money_semester'],
                    'money_way': i['money_way'],
                    'money_date': i['money_date'],
                    'money_details': i['money_details'],
                    'class_num': int(result2['class_num'])
                })  
        return render_template("ad_money.html", **locals())
    else:
        return redirect(url_for('login'))

# delete_money_btn 管理員刪除學生繳費紀錄
@app.route('/delete_money_btn', methods=['POST'])
def delete_money_btn():
    if request.method == 'POST':
        money_id = request.form['money_id']
        st_id = request.form['delete_money_st_id_input']
        semester_id = request.form['semester_id']

        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM `attend` WHERE `user_id`=%s AND `semester`=%s AND `status`='';", (st_id, semester_id))
            connection.commit()
            cursor.execute("UPDATE `money` SET `money_semester`= money_semester-1 WHERE `st_id`=%s AND `money_semester`> %s;", (st_id, semester_id))
            connection.commit()
            cursor.execute("UPDATE `students` SET `semester`=%s WHERE `st_id`=%s;", (semester_id, st_id))
            connection.commit()
            cursor.execute("DELETE FROM `money` WHERE `money_id`=%s", (money_id))
            connection.commit() 
        return redirect(url_for('ad_money'))
    else:
        return redirect(url_for('login'))

# search_st_tuiton 管理員再新增學生繳費紀錄先檢查學號是否正確
@app.route('/search_st_tuiton', methods=['POST'])
def search_st_tuiton():
    st_id = request.json.get('st_id')
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id FROM `users` WHERE user_id=%s AND role = 1 AND status = 1", (st_id,))
            result = cursor.fetchone()
            if result:
                return jsonify({"st_id": True})
            else:
                return jsonify({"st_id": False})
    except:
        return jsonify({"st_id": False})
    
# insert_st_tuiton 管理員新增學生繳費紀錄
@app.route('/insert_st_tuiton', methods=['POST'])
def insert_st_tuiton():
    st_id = request.json.get('st_id')
    st_pay = request.json.get('st_pay')
    st_pay_num = request.json.get('st_pay_num')
    st_way = request.json.get('st_way')
    st_pay_date = request.json.get('st_pay_date')
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 找出該生學費
            cursor.execute("SELECT tuition FROM `students` WHERE st_id=%s;", (st_id,))
            result = cursor.fetchone()
            tuition = result['tuition']
            # 找出該生是第幾學期
            cursor.execute("SELECT MAX(money_semester) as money_semester FROM `money` WHERE st_id =%s;", (st_id,))
            result = cursor.fetchone()
            if st_pay == '0':
                money_semester = result['money_semester'] + 1 if result and result['money_semester'] is not None else 1
            else:
                money_semester = 0
            money_now = []
            for i in range(int(st_pay_num)):
                if st_pay == '0':
                    cursor.execute("""INSERT INTO `money`(`st_id`, `money_semester`, `money`, `money_way`, `money_date`, `money_details`) 
                                VALUES (%s, %s, %s, %s, %s, %s)""", 
                                (st_id, money_semester, tuition, st_way, st_pay_date, st_pay))
                    money_semester += 1
                else:
                    cursor.execute("""INSERT INTO `money`(`st_id`, `money_semester`, `money`, `money_way`, `money_date`, `money_details`) 
                                VALUES (%s, %s, %s, %s, %s, %s)""", 
                                (st_id, 0, 1000, st_way, st_pay_date, st_pay))
                connection.commit()
                cursor.execute("SELECT money_id FROM `money` ORDER BY `money`.`money_id` DESC LIMIT 1") 
                result = cursor.fetchone()
                money_now.append(result['money_id'])
            cursor.execute("UPDATE `students` SET `pay_num`=`pay_num`+1  WHERE `st_id`=%s", (st_id))
            connection.commit()
        with connection.cursor() as cursor:
            money_record = [] 
            cursor.execute("SELECT * FROM `money`;")
            result = cursor.fetchall()
            for i in result:
                if i['money_way'] == 0:
                    i['money_way'] = '現金'
                else:
                    i['money_way'] = '匯款'

                if i['money_details'] == 0:
                    i['money_details'] = '學費'
                else:
                    i['money_details'] = '教材費'
                if i['money_semester'] == 0:
                    i['money_semester'] = '-'
                cursor.execute("SELECT COUNT(attend_id) as class_num FROM `attend` WHERE semester=%s AND user_id=%s AND (status = 1 or status = 3);", 
                               (i['money_semester'], i['st_id']))
                result2 = cursor.fetchone()
                if i['money_id'] in money_now:
                    money_record.append({
                        'money_id': i['money_id'],
                        'st_id': i['st_id'],
                        'money_semester': i['money_semester'],
                        'money_way': i['money_way'],
                        'money_date': i['money_date'],
                        'money_details': i['money_details'],
                        'class_num': int(result2['class_num']),
                        'is_new': True  # 標註為新增
                    })
                else:
                    money_record.append({
                        'money_id': i['money_id'],
                        'st_id': i['st_id'],
                        'money_semester': i['money_semester'],
                        'money_way': i['money_way'],
                        'money_date': i['money_date'],
                        'money_details': i['money_details'],
                        'class_num': int(result2['class_num']),
                        'is_new': False  # 標註為歷史資料
                    })

            currnet_st_id = st_id
            return jsonify({"success": True, "money_record": money_record, "currnet_st_id": currnet_st_id})
    except Exception as e:
        # print(e)
        return jsonify({"success": False, "message": str(e)})
    finally:
        connection.close()

# st_for_tr 學生與授課老師管理
@app.route('/st_for_tr', methods=['GET', 'POST'])
def st_for_tr():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '4':
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id))
            result = cursor.fetchone()
            name= result['name']
            picture_data = result['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime

            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

        st_data = []
        with connection.cursor() as cursor:
            cursor.execute("""
                            SELECT 
                                `semester`,
                                `st_id`,
                                `st_name`,
                                `tr_id`,
                                `tr_name`,
                                `classtime_id`,
                                `classroom_name`,
                                `class_week`,
                                `start_time`,
                                `end_time`,
                                `course_id`,
                                `course_name`
                            FROM 
                                `attend_view` 
                            WHERE 
                                `status` = '' 
                            GROUP BY 
                                `st_id`, `classtime_id`, `semester`
                            ORDER BY
                                `semester`, `st_id` ASC;
                           """)
            result = cursor.fetchall()
        for i in result:
            st_data.append({
                'st_semester' : i['semester'],
                'st_id' : i['st_id'],
                'st_name' : i['st_name'],
                'st_tr_id' : i['tr_id'],
                'st_tr_name' : i['tr_name'],
                'st_classtime_id' : i['classtime_id'],
                'st_classroom_name' : i['classroom_name'],
                'st_week' : i['class_week'],
                'st_start_time' : str(i['start_time'])[:-3],
                'st_end_time' : str(i['end_time'])[:-3],
                'st_course_id' : i['course_id'],
                'st_course_name' : i['course_name']
            })

        course_data = [] # 儲存可以選的教室時段
        with connection.cursor() as cursor:
            cursor.execute("""
                           SELECT 
                            ct.classtime_id, 
                            ct.class_week,
                            c.name, 
                            ct.class_week, 
                            ct.start_time, 
                            ct.end_time 
                           FROM `classtime` ct 
                           JOIN classroom c on c.classroom_id = ct.classroom_id;
                           """) # 列出所有上課時段
            result = cursor.fetchall()
        for i in result:
            course_data.append({
                'classtime_id' : i['classtime_id'],
                'classroom_name' : i['name'],
                'class_week' : i['class_week'],
                'start_time' : str(i['start_time'])[:-3],
                'end_time' : str(i['end_time'])[:-3],
                'trs' : []
            })
        
        with connection.cursor() as cursor:
            cursor.execute("""
                            SELECT 
                                ct.classtime_id, 
                                c.name AS classroom_name, 
                                c.st_num AS max_classroom, 
                                COUNT(a.attend_id) AS st_num, 
                                SUM(t.st_num) as tr_max, 
                                a.class_date 
                            FROM classroom c 
                            JOIN classtime ct ON ct.classroom_id = c.classroom_id 
                            JOIN attend a ON a.classtime_id = ct.classtime_id 
                            JOIN teachers t ON t.tr_id = a.tr_id 
                            GROUP BY a.class_date, ct.classtime_id;
                           """) # 這只能查到目前有人出席的時段(教室最大學生數 目前學生數 老師負擔最大學生數
            result = cursor.fetchall()

        # 找出額滿的時段
        remove_classtime_id = set()
        for i in result:
            if i['st_num'] == i['max_classroom'] or i['st_num'] == i['tr_max']:
                remove_classtime_id.add(i['classtime_id'])

        # 留下有空位的時段
        course_data = [course for course in course_data if course['classtime_id'] not in remove_classtime_id]

        # 查看有沒有老師可以教(這邊只有看人數)
        tr_data = []
        with connection.cursor() as cursor:
            cursor.execute('''
            SELECT 
                t.user_id,
                t.tr_id,
                t.user_id, 
                u.name,
                t.classtime_id,
                t.st_num as tr_max,
                COALESCE(subquery.st_num, 0) AS st_num
            FROM 
                teachers t
            LEFT JOIN 
            (
                SELECT 
                    t.tr_id, 
                    a.classtime_id,
                    COUNT(DISTINCT a.attend_id) AS st_num,
                    t.st_num AS tr_max
                FROM 
                    attend a
                JOIN 
                    teachers t ON t.tr_id = a.tr_id
                WHERE 
                    a.status = ''        
                GROUP BY 
                    a.classtime_id, t.tr_id
            ) subquery ON t.tr_id = subquery.tr_id
            JOIN users u ON t.user_id = u.user_id;
            ''')
            result = cursor.fetchall()

            remove_tr_id = set()
            # check = set()
            for i in result:
                cursor.execute("SELECT trc.course_id FROM `tr_course` trc JOIN courses c on c.course_id = trc.course_id WHERE user_id=%s ORDER BY course_id;", (i['user_id']))
                result2 = cursor.fetchall()
                tr_course_id = []
                for j in result2:
                    tr_course_id.append(j['course_id'])
                t = (i['tr_id'], i['classtime_id'], tr_course_id)
                if i['st_num'] >= i['tr_max']:
                    remove_tr_id.add(i['tr_id'])
                # if t not in check: 
                tr_data.append({
                    'tr_id' : i['tr_id'],
                    'tr_name' : i['name'],
                    'tr_classtime_id' : i['classtime_id'],
                    'tr_course_id' : tr_course_id,
                    'st_num': i['st_num'],
                    'tr_max': i['tr_max']
                })
                    # check.add(t)

        tr_data = [tr for tr in tr_data if tr['tr_id'] not in remove_tr_id]

        for course in course_data:
            for tr in tr_data:
                if tr['tr_classtime_id'] == course['classtime_id']:
                    course['trs'].append({
                        'tr_id': tr['tr_id'],
                        'tr_name': tr['tr_name'],
                        'tr_course_id' : tr['tr_course_id'],
                        'st_num': tr['st_num'],
                        'tr_max': tr['tr_max']
                    })

        course_data = [course for course in course_data if course['trs']]
  
        return render_template("st_for_tr.html", **locals())
    else:
        return redirect(url_for('login'))

# search_st_info 管理員新增學生上課時段 輸入學號 檢查該學生的資料
@app.route('/search_st_info', methods=['POST'])
def search_st_info():
    if request.method == 'POST':
        st_id = request.json.get('search_st_id')

        try:
            connection = get_db_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT u.name, s.course_id FROM `users` u JOIN students s on s.st_id = u.user_id WHERE u.user_id=%s AND u.role='1';", (st_id,))
                result1 = cursor.fetchone()
                st_name = result1['name'] if result1 else ''
                st_course_id = result1['course_id'] if result1 else ''

            with connection.cursor() as cursor:
                cursor.execute("SELECT a.semester, a.classtime_id, ct.class_week, a.tr_id, ct.start_time, ct.end_time FROM `attend` a JOIN classtime ct ON a.classtime_id = ct.classtime_id WHERE user_id=%s AND status='';", (st_id,))
                result2 = cursor.fetchall()
                st_semester = [int(i['semester']) for i in result2] if result2 else []
                st_classtime_id = [int(i['classtime_id']) for i in result2] if result2 else []
                st_class_week = [str(i['class_week']) for i in result2] if result2 else []
                st_tr_id = [int(i['tr_id']) for i in result2] if result2 else []
                st_start_time = [str(i['start_time']) for i in result2] if result2 else []
                st_end_time = [str(i['end_time']) for i in result2] if result2 else []

                cursor.execute("SELECT pay_num FROM `students` WHERE st_id=%s;", (st_id,))
                result3 = cursor.fetchone()
                pay_num = result3['pay_num']
            
            # 找當期開始日期
            with connection.cursor() as cursor:
                cursor.execute("SELECT semester ,MIN(class_date) as date FROM `attend` WHERE user_id=%s AND status = '' GROUP by semester ASC;", (st_id,))
                result4 = cursor.fetchall()
                semester_start_date = [str(i['date']) for i in result4] if result4 else []

                
            if (st_name != '' and st_course_id != ''):
                if st_classtime_id != []: 
                    return jsonify({
                        'first_time': False,
                        'pay_num' : pay_num,
                        'st_semester' : st_semester,
                        'semester_start_date': semester_start_date,
                        'st_name': st_name,
                        'st_course_id': st_course_id,
                        'st_classtime_id': st_classtime_id,
                        'st_class_week': st_class_week,
                        'st_tr_id': st_tr_id,
                        'st_start_time': st_start_time,
                        'st_end_time': st_end_time
                        })
                else:
                    # return jsonify({'st_name': '<span style="color: red">該生本期剩餘上課堂數為0!</span>'})
                    # 剛好上完或第一次排課
                    if pay_num > 0:
                        return jsonify({
                                'first_time': True,
                                'st_semester' : '新增下期',
                                'st_name': st_name,
                                'st_course_id': st_course_id,
                                })
                    else:
                        # 沒有繼續繳錢!
                        return jsonify({'st_name': '<span style="color: red">該生本期剩餘上課堂數為0!</span>'})
            else:
                return jsonify({'st_name': '<span style="color: red">查無資料!</span>'})

        except Exception as e:
            # 記錄錯誤資訊（可選）
            return jsonify({'st_name': '<span style="color: red">查無資料!</span>'})

        finally:
            connection.close()  # 確保連接關閉

# st_scheduleButton 管理員新增學生上課時段
@app.route('/st_scheduleButton', methods=['POST'])
def st_scheduleButton():
    if request.method == 'POST':
        st_id = request.form['search_st_id']
        st_semester = request.form.get('search_semester', 'new')
        old_classtime_id = request.form.get('old_classtime_id', '').split(',')
        currentSelection_val = request.form['currentSelection_val'].split(', ')
        st_schedule = {}
        
        # 構建課表信息
        if old_classtime_id != ['']:
            for i in range(len(old_classtime_id)):
                c, t = old_classtime_id[i].split()
                st_schedule[i] = {'classtime_id': int(c), 'tr_id': int(t), 'week': ''}

        for i in range(len(currentSelection_val)):
            c, t = currentSelection_val[i].split()
            st_schedule[len(st_schedule) + i] = {'classtime_id': int(c), 'tr_id': int(t), 'week': ''}

        # 獲取星期數映射
        week = ['一', '二', '三', '四', '五', '六', '日']
        connection = get_db_connection()

        with connection.cursor() as cursor:
            # 批量查詢所有 class_week 資料
            cursor.execute("SELECT classtime_id, class_week FROM `classtime`;")
            class_week_map = {row['classtime_id']: week.index(row['class_week']) for row in cursor.fetchall()}

            # 為課表添加星期數
            for i in st_schedule.keys():
                st_schedule[i]['week'] = class_week_map.get(st_schedule[i]['classtime_id'])

        if st_semester != 'new':
            # 更新現有學期的課程
            with connection.cursor() as cursor:
                try:
                    cursor.execute(
                        """SELECT attend_id, class_date FROM `attend`
                        WHERE `user_id`=%s AND `semester`=%s AND `status`='' AND `adjust`=0
                        ORDER BY class_date ASC;""", 
                        (st_id, st_semester)
                    )
                    result = cursor.fetchall()
                    attend_id = [int(i['attend_id']) for i in result]
                    class_num = len(attend_id)
                    class_start_date = min(i['class_date'] for i in result) if result else None
                    if not class_start_date:
                        return "No classes to update.", 400  # 提示無可更新課程

                    current_date = class_start_date
                    num = 1
                    updates = []
                    while num <= class_num:
                        for i in st_schedule.keys():
                            if num > class_num:
                                break
                            updates.append(
                                (st_schedule[i]['tr_id'], st_schedule[i]['classtime_id'], current_date, attend_id[num - 1])
                            )
                            # 更新到下一個課時的日期
                            days_ahead = (st_schedule[i]['week'] - current_date.weekday() + 7) % 7
                            if days_ahead == 0:
                                days_ahead = 7  # 跳到下一個相同的星期
                            current_date += timedelta(days=days_ahead)
                            num += 1
                    
                    # 批量執行 UPDATE 操作
                    cursor.executemany(
                        """UPDATE `attend` SET `tr_id`=%s, `classtime_id`=%s, `class_date`=%s
                        WHERE `attend_id`=%s;""", updates
                    )
                    connection.commit()
                except Exception as e:
                    connection.rollback()
                    raise e

        else:
            # 為新學期插入新課程
            class_start_date = datetime.strptime(request.form['search_semester_start_date'], '%Y-%m-%d')
            with connection.cursor() as cursor:
                try:
                    # 獲取最新學期編號
                    cursor.execute(
                        "SELECT MAX(semester) as semester FROM `attend` WHERE `user_id`=%s;", (st_id,)
                    )
                    result = cursor.fetchone()
                    st_semester = result['semester'] + 1 if result['semester'] else 1
                    
                    current_date = class_start_date
                    
                    num = 1
                    inserts = []
                    while num <= 20:
                        for i in st_schedule.keys():
                            if num > 20:
                                break
                            # 計算下次上課的日期
                            days_ahead = (st_schedule[i]['week'] - current_date.weekday() + 7) % 7
                            if days_ahead == 0:
                                days_ahead = 7
                            next_class_date = current_date + timedelta(days=days_ahead)
                            
                            inserts.append(
                                (st_semester, st_id, st_schedule[i]['tr_id'], st_schedule[i]['classtime_id'], next_class_date, '', 0)
                            )
                            
                            current_date = next_class_date  # 更新 current_date
                            num += 1
                    
                    # 批量執行 INSERT 操作
                    cursor.executemany(
                        """INSERT INTO `attend`(`semester`, `user_id`, `tr_id`, `classtime_id`, `class_date`, `status`, `adjust`)
                        VALUES (%s, %s, %s, %s, %s, %s, %s);""", inserts
                    )
                    
                    # 更新學生資訊
                    cursor.execute(
                        "UPDATE `students` SET `semester`=`semester`+1, `pay_num`=`pay_num`-1 WHERE `st_id`=%s;", 
                        (st_id,)
                    )
                    connection.commit()
                except Exception as e:
                    connection.rollback()
                    raise e

        return redirect(url_for('st_for_tr'))
    else:
        return redirect(url_for('login'))

# leave_st_scheduleButton 管理員刪除學生上課時段
@app.route('/leave_st_scheduleButton', methods=['POST'])
def leave_st_scheduleButton():
    if request.method == 'POST':
        st_id = request.form['st_id_forTr_leave_input']
        classtime_id = request.form['classtime_id_forTr_leave']
        semester = request.form['semester_forTr_leave']

        connection = get_db_connection()
        # 算出要刪除的時段有幾堂(未上)
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(attend_id) as leave_num FROM `attend` WHERE user_id=%s AND status = '' AND semester=%s AND classtime_id=%s", 
                            (st_id, semester, classtime_id))
            result = cursor.fetchone()
            leave_num = result['leave_num']
        # 刪除課程
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM `attend` WHERE user_id=%s AND semester=%s AND classtime_id=%s AND status = '' AND adjust = 0", 
                            (st_id, semester, classtime_id))
            connection.commit()
        try:
            # 找出最後上課天
            with connection.cursor() as cursor:
                cursor.execute("SELECT class_date FROM `attend` WHERE user_id=%s AND semester=%s AND status = '' AND adjust= 0 ORDER BY class_date DESC LIMIT 1;", 
                            (st_id, semester))
                result = cursor.fetchone()
                class_end_date = result['class_date']

            week = ['一', '二', '三', '四', '五', '六', '日']
            # 找出現在學生有哪些時段把他分配上去
            with connection.cursor() as cursor:
                cursor.execute("SELECT classtime_id FROM `attend` WHERE user_id =%s AND status = '' AND semester=%s AND tr_id2 = 0 AND adjust = 0 GROUP by classtime_id;", 
                                (st_id, semester))
                result = cursor.fetchall()
                current_schedule = dict()
                
                for i in result:
                    cursor.execute(("SELECT class_week FROM `classtime` WHERE `classtime_id`=%s;"), i['classtime_id'])
                    class_week = cursor.fetchone()
                    cursor.execute("SELECT tr_id FROM `attend` WHERE semester=%s AND user_id=%s AND classtime_id=%s AND tr_id2 = 0 and status = '' AND adjust = 0 GROUP BY tr_id;",
                                (semester,st_id, i['classtime_id']))
                    tr_id = cursor.fetchone()
                    current_schedule[i['classtime_id']] = [week.index(class_week['class_week']), tr_id['tr_id']]


                num = 1
                while num < leave_num:
                    class_end_date += timedelta(days=1)  # 每次加一天
                    weekday = class_end_date.weekday()

                    for k, v in current_schedule.items():
                        if weekday == v[0]:  # 假設 i[0] 是星期幾
                            cursor.execute(
                                "INSERT INTO `attend`(`semester`, `user_id`, `tr_id`, `classtime_id`, `class_date`) VALUES (%s, %s, %s, %s, %s)",
                                (semester, st_id, v[1], k, class_end_date)  # 這裡傳遞具體值
                            )
                            connection.commit()
                            num += 1
                            break
        except:
            with connection.cursor() as cursor:
                cursor.execute("UPDATE `students` SET `semester`=`semester`-1, `pay_num`=`pay_num`+1 WHERE `st_id`=%s;", (st_id,))
                connection.commit()
        return redirect(url_for('st_for_tr'))
    else:
        return redirect(url_for('login'))

# fc_scheduleButton 學生排課
@app.route("/fc_scheduleButton", methods=['POST'])
def fc_scheduleButton():
    if request.method == 'POST':
        user_id = session.get('user_id')
        classroomDateSelect = request.form['classroomDateSelect']
        # fc_classroomAreaSelect = request.form['fc_classroomAreaSelect']
        fc_classroomSelect = request.form['fc_classroomSelect']
        fc_classtime_id = request.form['fc_timeslotSelect'].split()[0]
        # class_week = fc_timeslotSelect[0][-1]
        # start_time = fc_timeslotSelect[1][:5]
        # end_time = fc_timeslotSelect[1][6:]

        tr_data = []
        connection = get_db_connection()
        
        with connection.cursor() as cursor:
            # 找現在是第幾學期
            cursor.execute("SELECT semester FROM `attend` WHERE user_id=%s AND status='' ORDER BY class_date ASC LIMIT 1;", 
                           (user_id)) 
            result = cursor.fetchone()
            semester = result['semester']

            # 先找那天的老師都有幾位學生
            # 找找看是否有原時段的老師
            cursor.execute("SELECT tr_id FROM `attend` WHERE user_id=%s AND classtime_id=%s AND semester=%s AND adjust=0 ORDER BY class_date DESC LIMIT 1;", 
                           (user_id, fc_classtime_id, semester))
            result = cursor.fetchone()
            print('u', user_id, 'fc_classtime_id', fc_classtime_id, 'semester', semester)
            if result:  # 检查 result 是否不是 None
                tr_id_old = result['tr_id']
            else:
                tr_id_old = ''

            # 同時段的老師
            cursor.execute("SELECT tr_id, COUNT(tr_id) as tr_st_num FROM `attend` WHERE class_date=%s AND classtime_id=%s GROUP BY tr_id;", 
                           (classroomDateSelect, fc_classtime_id))
            result = cursor.fetchall()
            for i in result:
                tr_data.append({
                    'tr_id': i['tr_id'],
                    'tr_st_num': i['tr_st_num']
                })
            # 調課的老師
            cursor.execute("SELECT tr_id2, COUNT(tr_id2) as tr_st_num FROM `attend` WHERE class_date=%s AND classtime_id=%s AND adjust=1 GROUP BY tr_id;", 
                           (classroomDateSelect, fc_classtime_id))
            result = cursor.fetchall()
            if result:
                for i in result:
                    tr_data.append({
                        'tr_id': i['tr_id'],
                        'tr_st_num': i['tr_st_num']
                    })
            tr_data.sort(key=lambda x: x['tr_st_num'])
            print(tr_data, '000')
            # 獲取學生最少的老師資訊
            if tr_id_old in tr_data or tr_data == []:
                min_tr_id = tr_id_old
            else:
                min_tr_id = tr_data[0]['tr_id']
            
            
            cursor.execute("INSERT INTO attend (user_id, semester, tr_id2, classtime_id, class_date, adjust) VALUES (%s, %s, %s, %s, %s, %s)", 
                            (user_id, semester, min_tr_id, fc_classtime_id, classroomDateSelect, 1))
            connection.commit()
            
        # try:
        #     connection = get_db_connection()

        #     # 找user的course_id
        #     with connection.cursor() as cursor:
        #         cursor.execute("SELECT course_id FROM students WHERE st_id = %s;", (user_id,))
        #         result = cursor.fetchone()
        #         course_id = result['course_id']

        #     with connection.cursor() as cursor:
        #         # 使用檢視表一次查詢所需數據
        #         cursor.execute("""
        #             SELECT classtime_id FROM classroom_schedule 
        #             WHERE classroom_name=%s AND class_week=%s AND start_time=%s AND end_time=%s
        #         """, (fc_classroomSelect, class_week, start_time, end_time))
        #         result = cursor.fetchone()
        #         classtime_id = result['classtime_id']
            

        #         # 查詢這是第幾學期
        #         cursor.execute("SELECT semester FROM `attend` WHERE user_id=%s AND status='' ORDER BY `attend`.`semester` ASC LIMIT 1;", (user_id))
        #         result = cursor.fetchone()
        #         semester = result['semester']

        #         # 插入數據到 attend 表
        #         cursor.execute("INSERT INTO attend (user_id, semester, classtime_id, class_date) VALUES (%s, %s, %s, %s)", 
        #                         (user_id, semester, classtime_id, classroomDateSelect))
        #         # 已經判斷好有老師可以教，現在去找要誰教


        #         # try:
        #         #     # 去找被教次數最多的老師
        #         #     cursor.execute("SELECT tr_id, COUNT(*) AS count FROM st_classtime WHERE user_id = %s AND classtime_id = %s GROUP BY tr_id ORDER BY count DESC LIMIT 1;", 
        #         #                     (user_id, classtime_id))
        #         #     result = cursor.fetchone()
        #         #     tr_id = result['tr_id']
        #         # except:
        #         #     # 去找有誰可以教
        #         #     if course_id <= 9:
        #         #         # 如果 course_id 小於或等於 9
        #         #         cursor.execute("SELECT tr_id FROM teachers WHERE classtime_id = %s AND course_id >= 9;", 
        #         #                     (classtime_id,))
        #         #     else:
        #         #         # 如果 course_id 大於 9
        #         #         cursor.execute("SELECT tr_id FROM teachers WHERE classtime_id = %s AND course_id = %s;", 
        #         #                     (classtime_id, course_id))
        #         #     result = cursor.fetchall()
        #         #     tr_data = []
        #         #     for i in result:
        #         #         tr_data.append(i['tr_id'])
                    
        #             # 查當日該時段的各老師的學生數
        #             # cursor.execute("SELECT tr_id, COUNT(*) AS st_num FROM st_classtime WHERE classtime_id=%s and class_date=%s GROUP BY tr_id ORDER BY count;", 
        #             #                 (classtime_id, classroomDateSelect))
        #             # result = cursor.fetchall()
        #             # tr_ok = []
        #             # for i in result:
        #             #     cursor.execute("SELECT st_num as max_st_num FROM teachers WHERE tr_id=%s;", (i['tr_id'],))
        #             #     result = cursor.fetchone()
        #             #     max_st_num = result['max_st_num']

        #             #     if i['st_num'] < max_st_num:
        #             #         tr_ok.append(i['tr_id'])

        #             # tr_ok = sorted(tr_ok)
                
        #         # cursor.execute("INSERT INTO st_classtime (st_id, classtime_id, tr_id, class_date) VALUES (%s, %s, %s, %s)", 
        #         #                (user_id, classtime_id, tr_ok[0], classroomDateSelect))
                    

        #         connection.commit()
        # finally:
        #     connection.close()
        return redirect(url_for('index'))
    return redirect(url_for('login'))

# tr_manage 老師資訊管理
@app.route('/tr_manage', methods=['GET', 'POST'])
def tr_manage():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '4':
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id))
            result = cursor.fetchone()
            name= result['name']
            picture_data = result['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime

            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

        course_data = []
        with connection.cursor() as cursor:
            cursor.execute("SELECT course_id, name FROM `courses`;")
            result = cursor.fetchall()
        for i in result:
            course_data.append({
                'course_id': i['course_id'],
                'course_name': i['name']
            })

        classtime_data = []
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM `classroom_schedule`")
            result = cursor.fetchall()
        for i in result:
            classtime_data.append({
                'classtime_id': i['classtime_id'],
                'classroom_name': i['classroom_name'],
                'classroom_schedule': i['classroom_name'] + " 禮拜" + i['class_week'] + str(i['start_time'])[:-3] + "-" + str(i['end_time'])[:-3]
            })
        
        tr_info = []
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM `users` WHERE role=3 AND status = 1;")
            result = cursor.fetchall()
        for i in result:
            picture_data = i['picture']
            # 確定圖片的 MIME 類型
            kind = filetype.guess(picture_data)
            mime_type = kind.mime
            # 將二進制數據編碼為 Base64 字串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

            tr_info.append({
                'user_id' : i['user_id'],
                'tr_acc' : i['acc'],
                'tr_pwd' : i['pwd'],
                'tr_age' : i['age'],
                'tr_address' : i['address'],
                'tr_phone1' : i['phone1'],
                'tr_phone2' : i['phone2'],
                'tr_email' : i['email'],
                'tr_picture' : picture,
                'tr_create_date' : i['create_date'],
            })

        tr_data = []
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id, tr_id, name, classtime_id, classroom_name, class_week, start_time, end_time, st_num FROM `teacher_schedule` ORDER BY classroom_name, class_week, user_id;")
            result = cursor.fetchall()
            for i in result:    
                course_id = []
                course_name = []
                cursor.execute("SELECT trc.*, c.name FROM `tr_course` trc JOIN courses c on c.course_id = trc.course_id WHERE user_id=%s ORDER BY course_id;", (i['user_id']))
                result2 = cursor.fetchall()
                cursor.execute("SELECT COUNT(attend_id) as class_st_num FROM `attend` WHERE tr_id=%s AND status = '';", (i['tr_id']))
                result3 = cursor.fetchone()
                for j in result2:
                    course_id.append(j['course_id'])
                    course_name.append(j['name'])
                course_name_str = ", ".join(course_name)
                tr_data.append({
                    'user_id': i['user_id'],
                    'tr_id': i['tr_id'],
                    'tr_name': i['name'],
                    'classtime_id': i['classtime_id'],
                    'classroom_name': i['classroom_name'],
                    'class_week': i['class_week'],
                    'start_time': str(i['start_time'])[:-3],
                    'end_time': str(i['end_time'])[:-3],
                    'course_id': course_id,
                    'course_name': course_name_str,
                    'st_num': i['st_num'],
                    'have_st': int(result3['class_st_num'])
                })


        return render_template("tr_manage.html", **locals())
    else:
        return redirect(url_for('login'))

# editTeacherButton 管理員編輯老師資訊
@app.route('/editTeacherButton', methods=['POST'])
def editTeacherButton():
    if request.method == 'POST':
        tr_id = request.form['tr_id']
        tr_name = request.form['tr_name']
        tr_age = request.form['tr_age']
        tr_acc = request.form['tr_acc']
        tr_pwd = request.form['tr_pwd']
        tr_course_val_choose = [int(i) for i in request.form['tr_course_val_choose'].split(',')]
        tr_phone1 = request.form['tr_phone1']
        tr_phone2 = request.form['tr_phone2']
        tr_address = request.form['tr_address']
        tr_email = request.form['tr_email']
        tr_classtime_id = request.form['tr_classtime_edit']
        tr_st_num = request.form['tr_st_num']

        # Encrypt the password if it's being updated
        if tr_pwd:  # Only hash password if it's provided
            hashed_password = bcrypt.generate_password_hash(tr_pwd).decode('utf-8')
        else:
            hashed_password = None  # No password update, so don't modify it

        # Initialize current course list
        current_course_val = []

        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Update user information
            if hashed_password:  # If password is provided, update it
                cursor.execute("""
                    UPDATE `users` 
                    SET `acc`=%s, `pwd`=%s, `name`=%s, `age`=%s, `address`=%s, `phone1`=%s, `phone2`=%s, `email`=%s 
                    WHERE `user_id`=%s
                """, (tr_acc, hashed_password, tr_name, tr_age, tr_address, tr_phone1, tr_phone2, tr_email, tr_id))
            else:  # If password is not provided, do not update it
                cursor.execute("""
                    UPDATE `users` 
                    SET `acc`=%s, `name`=%s, `age`=%s, `address`=%s, `phone1`=%s, `phone2`=%s, `email`=%s 
                    WHERE `user_id`=%s
                """, (tr_acc, tr_name, tr_age, tr_address, tr_phone1, tr_phone2, tr_email, tr_id))
            connection.commit()

            # Update the number of students in the class
            cursor.execute("UPDATE `teachers` SET `st_num`=%s WHERE `user_id`=%s AND `classtime_id`=%s", 
                           (tr_st_num, tr_id, tr_classtime_id))
            connection.commit()

            # Get current courses
            cursor.execute("SELECT course_id FROM `tr_course` WHERE user_id=%s;", (tr_id,))
            result = cursor.fetchall()
            for i in result:
                current_course_val.append(i['course_id'])

            # Find the new courses to be added
            new_courses = set(tr_course_val_choose) - set(current_course_val)

            # Find the courses to be removed (courses that are in the current list but not in the new list)
            removed_courses = set(current_course_val) - set(tr_course_val_choose)

            # Insert new courses
            if new_courses:
                insert_query = "INSERT INTO `tr_course` (`user_id`, `course_id`) VALUES (%s, %s)"
                cursor.executemany(insert_query, [(tr_id, int(i)) for i in sorted(new_courses)])
                connection.commit()

            # Remove unassigned courses
            if removed_courses:
                delete_query = "DELETE FROM `tr_course` WHERE `user_id`=%s AND `course_id` IN (%s)"
                cursor.execute(delete_query, (tr_id, ','.join(map(str, removed_courses))))
                connection.commit()

        return redirect(url_for('tr_manage'))
    else:
        return redirect(url_for('login'))

# leaveTeacherButton 管理員刪除老師資訊(時段)
@app.route('/leaveTeacherButton', methods=['POST'])
def leaveTeacherButton():
    if request.method == 'POST':
        tr_id = request.form['tr_id']
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 更新使用者資訊
            cursor.execute("DELETE FROM `teachers` WHERE tr_id=%s;", (tr_id))
            connection.commit()
        return redirect(url_for('tr_manage'))
    else:
        return redirect(url_for('login'))

# tr_insertDataButton 管理員新增老師資訊
@app.route('/tr_insertDataButton', methods=['POST'])
def tr_insertDataButton():
    if request.method == 'POST':
        tr_acc = request.form['tr_acc']
        tr_pwd = request.form['tr_pwd']
        tr_name = request.form['tr_name']
        tr_age = request.form['age']
        tr_email = request.form['email']
        tr_address = request.form['address']
        tr_phone1 = request.form['phone1']
        tr_phone2 = request.form['phone2']
        tr_classtime_id = [int(i) for i in request.form['tr_classtimeid_choose_insert'].split(',')]
        tr_course_id = [int(i) for i in request.form['tr_course_val_choose_insert'].split(',')]
        tr_st_num = request.form['tr_st_num_insert']
        
        # Encrypt password using bcrypt
        hashed_password = bcrypt.generate_password_hash(tr_pwd).decode('utf-8')

        # Default image
        with open('templates/assets/img/avatar/avatar-4.png', 'rb') as file:
            picture = file.read()
        
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Insert teacher data into users table with hashed password
            cursor.execute("""INSERT INTO `users`(`acc`, `pwd`, `name`, `age`, `address`, `phone1`, `phone2`, `email`, `picture`, `create_date`, `role`, `status`) 
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""", 
                            (tr_acc, hashed_password, tr_name, tr_age, tr_address, tr_phone1, tr_phone2, tr_email, picture, datetime.today(), "3", "1"))
            connection.commit()

            cursor.execute("SELECT user_id FROM `users` ORDER BY `user_id` DESC LIMIT 1;")
            result = cursor.fetchone()
            tr_id = result['user_id']

            # Insert into teachers table for classtime
            for i in tr_classtime_id:
                cursor.execute("INSERT INTO `teachers`(`user_id`, `classtime_id`, `st_num`) VALUES (%s, %s, %s)", 
                               (tr_id, i, tr_st_num))
                connection.commit()
                
            # Insert into tr_course table for courses
            for i in tr_course_id:
                cursor.execute("INSERT INTO `tr_course`(`user_id`, `course_id`) VALUES (%s, %s)", (tr_id, i))
                connection.commit()

        return redirect(url_for('tr_manage'))
    else:
        return redirect(url_for('login'))

# searchTeacher 管理員新增老師時段 檢查老師編號是否存在
@app.route('/searchTeacher', methods=['POST'])
def searchTeacher():
    tr_id = request.json.get('tr_id')
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT `classtime_id` FROM `teachers` WHERE `user_id`=%s;", (tr_id,))
            result = cursor.fetchall()
            tr_classtime_id  = []
            if result:
                for i in result:
                    tr_classtime_id.append(i['classtime_id'])
                cursor.execute("SELECT `user_id`, `name` FROM `users` WHERE `user_id`=%s AND status = 1 AND `role` =3;", (tr_id,))
                result = cursor.fetchone()
                if result:
                    return jsonify({
                        "tr_id": result['user_id'],
                        'tr_name': result['name'],
                        'tr_classtime_id' : tr_classtime_id
                        })
            else:
                return jsonify({"tr_name": '<span style="color: red">查無資料!</span>'})
    except:
        return jsonify({"tr_name": '<span style="color: red">查無資料!kk</span>'})

# tr_insetTimeButton 管理員新增老師時段
@app.route('/tr_insetTimeButton', methods=['POST'])
def tr_insetTimeButton():
    if request.method == 'POST':
        tr_id = request.form['search_tr_id']
        tr_classtimeid_choose_search = [int(i) for i in request.form['tr_classtimeid_choose_search'].split(',')]
        tr_st_num_insert = int(request.form['tr_st_num_insert'])
        connection = get_db_connection()
        with connection.cursor() as cursor:
            for i in tr_classtimeid_choose_search:
                cursor.execute("INSERT INTO `teachers`(`user_id`, `classtime_id`, `st_num`) VALUES (%s, %s, %s)", (tr_id, i, tr_st_num_insert))
                connection.commit()
        return redirect(url_for('tr_manage'))
    return redirect(url_for('login'))

# login 登入
@app.route('/login', methods=['GET', 'POST'])
def login():
    session['login_status'] = ""
    if request.method == 'POST':
        acc = request.form['acc']
        pwd = request.form['pwd']

        try:
            connection = get_db_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE acc=%s", (acc,))
                result = cursor.fetchone()
                
                if result:
                    stored_password = result['pwd']

                    # 如果是純文字密碼並且匹配成功
                    if stored_password == pwd:
                        # 純文字密碼加密並更新到資料庫
                        hashed_password = bcrypt.generate_password_hash(pwd).decode('utf-8')
                        cursor.execute("UPDATE users SET pwd=%s WHERE acc=%s", (hashed_password, acc))
                        connection.commit()

                        # 登錄成功後存儲會話資料
                        session['login_status'] = "True"
                        session['user_id'] = result['user_id']
                        session['role'] = result['role']
                        session['status'] = result['status']

                        # 根據角色跳轉到不同頁面
                        if session['role'] == '1':  # 學生
                            return redirect(url_for('index'))
                        
                        elif session['role'] == '3':  # 老師
                            return redirect(url_for('tr_index'))
                        
                        elif session['role'] == '4':  # 管理員
                            return redirect(url_for('ad_index')) 

                    # 如果是加密密碼，進行驗證
                    elif bcrypt.check_password_hash(stored_password, pwd):
                        session['login_status'] = "True"
                        session['user_id'] = result['user_id']
                        session['role'] = result['role']
                        session['status'] = result['status']

                        # 根據角色跳轉到不同頁面
                        if session['role'] == '1':  # 學生
                            return redirect(url_for('index'))
                        
                        elif session['role'] == '3':  # 老師
                            return redirect(url_for('tr_index'))
                        
                        elif session['role'] == '4':  # 管理員
                            return redirect(url_for('ad_index')) 
                    else:
                        session['login_status'] = "False"
                        return render_template('login.html', error="密碼錯誤")

                else:
                    session['login_status'] = "False"
                    return render_template('login.html', error="用戶不存在")

        except Exception as e:
            return render_template('login.html', error="發生錯誤，請稍後再試")
        finally:
            connection.close()

    return render_template('login.html')

# logout 登出
@app.route('/logout')
def logout():
    session.clear()  # 清除會話
    return redirect(url_for('login'))

# 防止瀏覽器快存 避免登出後按返回還能看到系統 
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response


# if __name__ == "__main__":
#     app.debug = True
#     app.run()

if __name__ == "__main__":
    try:
        # 啟動定時任務調度器
        scheduler.start()

        # 啟動 Flask 應用
        app.run(debug=True, use_reloader=False)  # use_reloader=False 是為了防止調度器被多次啟動
    except (KeyboardInterrupt, SystemExit):
        # 當程式終止時，關閉調度器
        scheduler.shutdown()

if __name__ == "__main__":
    try:
        app.run()
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()

# @app.route("/scheduleButton", methods=['POST'])
# def scheduleButton():
#     if request.method == 'POST':
#         user_id = session.get('user_id')
#         classroomAreaSelect = request.form['classroomAreaSelect']
#         classroomSelect = request.form['classroomSelect']
#         class_date = datetime.strptime(request.form['classDate'], '%Y-%m-%d')
#         timeslotSelect = request.form['timeslotSelect'].split()
#         classNumSelect = int(request.form['classNumSelect'])
#         class_week = timeslotSelect[0][-1]
#         start_time = timeslotSelect[1][:5]
#         end_time = timeslotSelect[1][6:]

#         connection = get_db_connection()
#         with connection.cursor() as cursor:
#             cursor.execute("SELECT count(attend_id) as semester FROM attend WHERE user_id=%s AND (status='1' OR status='3')", (user_id))
#             result = cursor.fetchone()
#             semester = result['semester'] // 20 + 1
        
#         with connection.cursor() as cursor:
#             cursor.execute("SELECT classtime_id FROM classroom_schedule WHERE classroom_name=%s AND class_week=%s AND start_time=%s AND end_time=%s;", 
#                                 (classroomSelect, class_week, start_time, end_time))
#             result = cursor.fetchone()
#             classtime_id = result['classtime_id']

#         for i in range(classNumSelect):
#             with connection.cursor() as cursor:
#                 cursor.execute("INSERT INTO `attend`(`semester`, `user_id`, `classtime_id`, `class_date`) VALUES (%s, %s, %s, %s)", 
#                                 (semester, user_id, classtime_id, class_date))
#             connection.commit()
#             class_date += timedelta(days=7)       
#         return redirect(url_for('index'))
#     return redirect(url_for('login'))

# @app.route("/leaveButton", methods=['POST'])
# def leaveButton():
    # login_status = session.get('login_status')
    # user_id = session.get('user_id')
    # role = session.get('role')

    # if login_status == "True" and  role == '1':
    #     leaveDate = datetime.strptime(request.form.get('leaveDate'), '%Y-%m-%d')
    #     endDate = datetime.strptime(request.form.get('endDate'), '%Y-%m-%d')

    #     connection = get_db_connection()
    #     with connection.cursor() as cursor:
    #             cursor.execute("SELECT semester FROM `attend` WHERE user_id=%s ORDER BY `semester` DESC LIMIT 1;", (user_id,))
    #             result = cursor.fetchone()
    #             semester = result['semester']

    #     with connection.cursor() as cursor:
    #         cursor.execute("UPDATE `attend` SET `status`=2 WHERE semester=%s AND class_date BETWEEN %s AND %s;",
    #             (semester, leaveDate, endDate)
    #         )
    #         connection.commit()

    #     return redirect(url_for('index'))
    # else:
    #     return redirect(url_for('login'))
