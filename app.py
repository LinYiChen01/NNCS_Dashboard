import os
import base64, re
from datetime import datetime, timedelta
import filetype
from flask import Flask, render_template, request, abort, session, redirect, url_for, make_response, jsonify
from apscheduler.schedulers.background import BackgroundScheduler
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
    TextMessage
)
from linebot.v3.webhooks import (
    MessageEvent,
    TextMessageContent
)

# Channel Access Token
configuration = Configuration(access_token='ezTOh8SMwv3ATxslU3Wk4Bm5oAiP3cKadO+xnXZYiRNMOkl2R6w0IBuulijnc088OqwZJgjodYEcSiZO/n3mKfLVraN1GIFciPkcMANaPw4F8K1lyQKZ48SpGGp2KrxcVVQt8tu90S7R6EgIjazW9wdB04t89/1O/w1cDnyilFU=')
# Channel Secret
handler = WebhookHandler('8c6f630875f7495650df8b1827587a24')

# 資料庫
def get_db_connection():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='',
        db='nncs',
        cursorclass=pymysql.cursors.DictCursor)

# 圖片大小限制 (64KB)
MAX_CONTENT_LENGTH = 64 * 1024


app = Flask(__name__, static_folder='templates/assets')
# scheduler = BackgroundScheduler()

# def print_ok():
#     print("Ok")

# # 設定定時任務：從今晚21:30開始，每5分鐘執行一次
# scheduler.add_job(print_ok, 'cron', day_of_week='0-6', hour=22, minute=15)
# scheduler.start()

app.secret_key = os.urandom(24)  # 随机生成一个24字节的密钥

# line webhook
@app.route("/callback", methods=['POST'])
def callback():
    # get X-Line-Signature header value
    signature = request.headers['X-Line-Signature']

    # get request body as text
    body = request.get_data(as_text=True)
    app.logger.info("Request body: " + body)

    # handle webhook body
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        app.logger.info("Invalid signature. Please check your channel access token/channel secret.")
        abort(400)
    return 'OK'

# linebot 訊息處理
@handler.add(MessageEvent, message=TextMessageContent)
def handle_message(event):
    user_input = event.message.text  # 獲取用戶輸入的訊息（帳號）

    # 連接到資料庫
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # 查詢帳號和密碼
        query = "SELECT acc, pwd FROM users WHERE acc = %s"
        cursor.execute(query, (user_input,))
        result = cursor.fetchone()
        
        if result:
            acc = result['acc']
            pwd = result['pwd']
            reply_text = f"帳號: {acc}\n密碼: {pwd}"
        else:
            reply_text = "未找到該帳號。"
        
        # 回應用戶
        with ApiClient(configuration) as api_client:
            line_bot_api = MessagingApi(api_client)
            line_bot_api.reply_message_with_http_info(
                ReplyMessageRequest(
                    reply_token=event.reply_token,
                    messages=[TextMessage(text=reply_text)]
                )
            )
        
    except pymysql.MySQLError as err:
        with ApiClient(configuration) as api_client:
            line_bot_api = MessagingApi(api_client)
            line_bot_api.reply_message_with_http_info(
                ReplyMessageRequest(
                    reply_token=event.reply_token,
                    messages=[TextMessage(text="資料庫連接錯誤，請稍後再試。")]
                )
            )
    finally:
        cursor.close()
        connection.close()

# index 首頁
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
                classroom_data.append({
                    'classtime_id' : i['classtime_id'],
                    'classroom' : i['name'],
                    'class_week' : i['class_week'],
                    'start_time' : str(i['start_time'])[:-3],
                    'end_time' : str(i['end_time'])[:-3] 
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

            # 將二進制數據編碼為 Base64 字符串
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
            # # 繳費/教材費(4) -> 橘色
            # else:
            #     border_color = "#efa567"
            #     text_color = '#efa567'
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
            if i['st_num'] == 2:
            # if i['st_num'] == i['tr_max_st'] or  i['st_num'] == i['classroom_max_st']:
                classroom_attend_data.append({
                    'class_date': i['class_date'].strftime('%Y-%m-%d'),
                    'classtime_id': i['classtime_id'],
                })

        connection.close()
        return render_template("index.html", **locals())
    else:
        return redirect(url_for('login'))


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

            # 將二進制數據編碼為 Base64 字符串
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
                            (i, datetime.strptime('2024-10-14', '%Y-%m-%d')))
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
                            (i, datetime.strptime('2024-10-14', '%Y-%m-%d')))
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
                    # 將二進制數據編碼為 Base64 字符串
                    encoded_img = base64.b64encode(picture_data).decode('utf-8')
                    # 構建適用於前端的 Base64 數據 URL
                    picture = f"data:{mime_type};base64,{encoded_img}"
                    i['picture'] = picture
                    cursor.execute("SELECT MAX(class_date) AS last_date FROM attend WHERE (class_date < %s OR (class_date = %s AND classtime_id !=%s)) AND user_id=%s AND status=1;",
                                    (datetime.strptime('2024-10-14', '%Y-%m-%d'), datetime.strptime('2024-10-14', '%Y-%m-%d'), i['classtime_id'], i['st_id']))
                    result = cursor.fetchone()
                    last_date = result['last_date']
                    if last_date:
                        cursor.execute(""" 
                                    SELECT c.name, s.progress
                                                FROM `stprogress` s
                                                JOIN courses c
                                                ON c.course_id = s.course_id
                                                WHERE s.st_id=%s AND s.classroom_id=%s AND s.class_date=%s;
                                        """, 
                                        (i['st_id'], i['classtime_id'], last_date))
                        result = cursor.fetchone()
                        i['course_name'] = result['name']
                        i['course_progress'] = result['progress']
                        
               

        connection.close()
        return render_template("tr_index.html", **locals())
    else:
        return redirect(url_for('login'))
    
@app.route('/choose_st_schedule', methods=['GET', 'POST'])
def choose_st_schedule():
    date = request.json.get('selected_date')
    tr_id = request.json.get('tr_id')
    # return jsonify({"st_id": date, 'ddd': tr_id})
    try:
        st_data = []
        connection = get_db_connection()
        with connection.cursor() as cursor:
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
                    # 將二進制數據編碼為 Base64 字符串
                    encoded_img = base64.b64encode(picture_data).decode('utf-8')
                    # 構建適用於前端的 Base64 數據 URL
                    picture = f"data:{mime_type};base64,{encoded_img}"
                    i['picture'] = picture
                    cursor.execute("SELECT MAX(class_date) AS last_date FROM attend WHERE (class_date < %s OR (class_date = %s AND classtime_id !=%s)) AND user_id=%s AND status=1;",
                                    (date, date, i['classtime_id'], i['st_id']))
                    result = cursor.fetchone()
                    last_date = result['last_date']
                    if last_date:
                        cursor.execute(""" 
                                    SELECT c.name, s.progress
                                                FROM `stprogress` s
                                                JOIN courses c
                                                ON c.course_id = s.course_id
                                                WHERE s.st_id=%s AND s.classroom_id=%s AND s.class_date=%s;
                                        """, 
                                        (i['st_id'], i['classtime_id'], last_date))
                        result = cursor.fetchone()
                        i['course_name'] = result['name']
                        i['course_progress'] = result['progress']
        if len(st_data) !=0:
            return jsonify(st_data)
        else:
            return jsonify("查無資料")          
    except:
        return jsonify({'查無資料'})    

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

            # 將二進制數據編碼為 Base64 字符串
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
            # 將二進制數據編碼為 Base64 字符串
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

            # 將二進制數據編碼為 Base64 字符串
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

            # 將二進制數據編碼為 Base64 字符串
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
            # 將二進制數據編碼為 Base64 字符串
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

            for i in range(int(st_pay_num)):
                # semester_value = money_semester if st_pay != 1 else 0  # 判断学期值
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
                money_record.append({
                    'money_id': i['money_id'],
                    'st_id': i['st_id'],
                    'money_semester': i['money_semester'],
                    'money_way': i['money_way'],
                    'money_date': i['money_date'],
                    'money_details': i['money_details'],
                    'class_num': int(result2['class_num'])
                })  
            currnet_st_id = st_id
            return jsonify({"success": True, "money_record": money_record, "currnet_st_id": currnet_st_id})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    finally:
        connection.close()

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

            # 將二進制數據編碼為 Base64 字符串
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
                    COUNT(a.attend_id) AS st_num,
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
                if i['st_num'] == i['tr_max']:
                    remove_tr_id.add(i['tr_id'])
                # if t not in check: 
                tr_data.append({
                    'tr_id' : i['tr_id'],
                    'tr_name' : i['name'],
                    'tr_classtime_id' : i['classtime_id'],
                    'tr_course_id' : tr_course_id
                })
                    # check.add(t)

        tr_data = [tr for tr in tr_data if tr['tr_id'] not in remove_tr_id]

        for course in course_data:
            for tr in tr_data:
                if tr['tr_classtime_id'] == course['classtime_id']:
                    course['trs'].append({
                        'tr_id': tr['tr_id'],
                        'tr_name': tr['tr_name'],
                        'tr_course_id' : tr['tr_course_id']
                    })

        course_data = [course for course in course_data if course['trs']]
  
        return render_template("st_for_tr.html", **locals())
    else:
        return redirect(url_for('login'))


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
            # 记录错误信息（可选）
            return jsonify({'st_name': '<span style="color: red">查無資料!</span>'})

        finally:
            connection.close()  # 确保连接关闭

@app.route('/st_scheduleButton', methods=['POST'])
def st_scheduleButton():
    if request.method == 'POST':
        st_id = request.form['search_st_id']
        st_semester = request.form.get('search_semester', 'new')
        old_classtime_id = request.form.get('old_classtime_id', '').split(',')
        currentSelection_val = request.form['currentSelection_val'].split(', ')
        st_schedule = {}
        
        # 构建课表信息
        if old_classtime_id != ['']:
            for i in range(len(old_classtime_id)):
                c, t = old_classtime_id[i].split()
                st_schedule[i] = {'classtime_id': int(c), 'tr_id': int(t), 'week': ''}

        for i in range(len(currentSelection_val)):
            c, t = currentSelection_val[i].split()
            st_schedule[len(st_schedule) + i] = {'classtime_id': int(c), 'tr_id': int(t), 'week': ''}

        # 获取星期数映射
        week = ['一', '二', '三', '四', '五', '六', '日']
        connection = get_db_connection()

        with connection.cursor() as cursor:
            # 批量查询所有 class_week 数据
            cursor.execute("SELECT classtime_id, class_week FROM `classtime`;")
            class_week_map = {row['classtime_id']: week.index(row['class_week']) for row in cursor.fetchall()}
            print(class_week_map)

            # 为课表添加星期数
            for i in st_schedule.keys():
                st_schedule[i]['week'] = class_week_map.get(st_schedule[i]['classtime_id'])
                print(st_schedule[i]['week'])

        if st_semester != 'new':
            # 更新现有学期的课程
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
                        return "No classes to update.", 400  # 提示无可更新课程

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
                            # 更新到下一个课时的日期
                            days_ahead = (st_schedule[i]['week'] - current_date.weekday() + 7) % 7
                            current_date += timedelta(days=days_ahead)
                            num += 1
                    
                    # 批量执行 UPDATE 操作
                    cursor.executemany(
                        """UPDATE `attend` SET `tr_id`=%s, `classtime_id`=%s, `class_date`=%s
                        WHERE `attend_id`=%s;""", updates
                    )
                    connection.commit()
                except Exception as e:
                    connection.rollback()
                    raise e

        else:
            # 为新学期插入新课程
            class_start_date = datetime.strptime(request.form['search_semester_start_date'], '%Y-%m-%d')
            with connection.cursor() as cursor:
                try:
                    # 获取最新学期编号
                    cursor.execute(
                        "SELECT MAX(semester) as semester FROM `attend` WHERE `user_id`=%s;", 
                        (st_id,)
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
                            inserts.append(
                                (st_semester, st_id, st_schedule[i]['tr_id'], st_schedule[i]['classtime_id'], current_date, '', 0)
                            )
                            # 更新到下一个课时的日期
                            print("st_schedule[i]['week']" , st_schedule[i]['week'] )
                            days_ahead = (st_schedule[i]['week'] - current_date.weekday() + 7) % 7
                            current_date += timedelta(days=days_ahead)
                            num += 1
                    
                    # 批量执行 INSERT 操作
                    cursor.executemany(
                        """INSERT INTO `attend`(`semester`, `user_id`, `tr_id`, `classtime_id`, `class_date`, `status`, `adjust`)
                        VALUES (%s, %s, %s, %s, %s, %s, %s);""", inserts
                    )
                    
                    # 更新学生信息
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
        return redirect(url_for('st_for_tr'))
    else:
        return redirect(url_for('login'))


@app.route('/st_insertDataButton', methods=['GET', 'POST'])
def st_insertDataButton():
    if request.method == 'POST':
        name = request.form['name']
        age = request.form['age']
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
        # 預設圖片
        with open('templates/assets/img/avatar/avatar-1.png', 'rb') as file:
            picture = file.read()

        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO users (name, age, address, phone1, phone2, email, picture, create_date, role, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", 
                                   (name, age, address, phone1, phone2, email, picture, datetime.today(), '1', '1'))
            
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users ORDER BY user_id DESC LIMIT 1;")
            result = cursor.fetchone()
            st_id = result['user_id']

        with connection.cursor() as cursor:
            cursor.execute("UPDATE users SET acc=%s, pwd=%s WHERE user_id=%s;", ('st'+str(st_id), 'st'+str(st_id), st_id))
        
        
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO students (st_id, workplace, profession, parent, tuition, pay_num, course_id, note) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
                                   (st_id, workplace, profession, parent, tuition, 0, course_id, note))
        
        connection.commit() 
        return redirect(url_for('ad_index'))
    else:
        return redirect(url_for('login'))

@app.route('/editStudentButton', methods=['GET', 'POST'])
def editStudentButton():
    if request.method == 'POST':
        st_id = request.form['st_id']
        name = request.form['st_name']
        age = request.form['st_age']
        acc = request.form['st_acc']
        pwd = request.form['st_pwd']
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

        with connection.cursor() as cursor:
            cursor.execute("UPDATE users SET acc=%s, pwd=%s, name=%s, age=%s, address=%s, phone1=%s, phone2=%s, email=%s WHERE user_id=%s;", 
                           (acc, pwd, name, age, address, phone1, phone2, email, st_id))
        
        with connection.cursor() as cursor:
            cursor.execute("UPDATE students SET workplace=%s, profession=%s, parent=%s, tuition=%s, course_id=%s, note=%s WHERE st_id=%s;", 
                           (workplace, profession, parent, tuition, course_id, note, st_id))
        connection.commit() 
        return redirect(url_for('ad_index'))
    else:
        return redirect(url_for('login'))

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



# 單堂加課
@app.route("/fc_scheduleButton", methods=['POST'])
def fc_scheduleButton():
    if request.method == 'POST':
        user_id = session.get('user_id')
        classroomDateSelect = request.form['classroomDateSelect']
        fc_classroomAreaSelect = request.form['fc_classroomAreaSelect']
        fc_classroomSelect = request.form['fc_classroomSelect']
        fc_timeslotSelect = request.form['fc_timeslotSelect'].split()
        class_week = fc_timeslotSelect[0][-1]
        start_time = fc_timeslotSelect[1][:5]
        end_time = fc_timeslotSelect[1][6:]
        
        try:
            connection = get_db_connection()

            # 找user的course_id
            with connection.cursor() as cursor:
                cursor.execute("SELECT course_id FROM students WHERE st_id = %s;", (user_id,))
                result = cursor.fetchone()
                course_id = result['course_id']

            with connection.cursor() as cursor:
                # 使用檢視表一次查詢所需數據
                cursor.execute("""
                    SELECT classtime_id FROM classroom_schedule 
                    WHERE classroom_name=%s AND class_week=%s AND start_time=%s AND end_time=%s
                """, (fc_classroomSelect, class_week, start_time, end_time))
                result = cursor.fetchone()
                classtime_id = result['classtime_id']
            

                # 查詢這是第幾學期
                cursor.execute("SELECT count(attend_id) as semester FROM attend WHERE user_id=%s AND (status='1' OR status='3');", 
                                (user_id))
                result = cursor.fetchone()
                semester = result['semester'] // 20 + 1

                # 插入數據到 attend 表
                try:
                    # 把請假的課程 重新加入
                    cursor.execute("SELECT attend_id FROM attend WHERE user_id=%s AND classtime_id=%s AND class_date=%s AND status='2'", 
                                    (user_id, classtime_id, classroomDateSelect))
                    result = cursor.fetchone()
                    attend_id = result['attend_id']
                    cursor.execute("UPDATE attend SET status='' WHERE attend_id=%s;", (attend_id,))
                    connection.commit()
                except:
                    cursor.execute("INSERT INTO attend (user_id, semester, classtime_id, class_date) VALUES (%s, %s, %s, %s)", 
                                   (user_id, semester, classtime_id, classroomDateSelect))
                    try:
                        # 去找被教次數最多的老師
                        cursor.execute("SELECT tr_id, COUNT(*) AS count FROM st_classtime WHERE user_id = %s AND classtime_id = %s GROUP BY tr_id ORDER BY count DESC LIMIT 1;", 
                                        (user_id, classtime_id))
                        result = cursor.fetchone()
                        tr_id = result['tr_id']
                    except:
                        # 去找有誰可以教
                        if course_id <= 9:
                            # 如果 course_id 小於或等於 9
                            cursor.execute("SELECT tr_id FROM teachers WHERE classtime_id = %s AND course_id >= 9;", 
                                        (classtime_id,))
                        else:
                            # 如果 course_id 大於 9
                            cursor.execute("SELECT tr_id FROM teachers WHERE classtime_id = %s AND course_id = %s;", 
                                        (classtime_id, course_id))
                        result = cursor.fetchall()
                        tr_data = []
                        for i in result:
                            tr_data.append(i['tr_id'])
                        
                        # 查當日該時段的各老師的學生數
                        # cursor.execute("SELECT tr_id, COUNT(*) AS st_num FROM st_classtime WHERE classtime_id=%s and class_date=%s GROUP BY tr_id ORDER BY count;", 
                        #                 (classtime_id, classroomDateSelect))
                        # result = cursor.fetchall()
                        # tr_ok = []
                        # for i in result:
                        #     cursor.execute("SELECT st_num as max_st_num FROM teachers WHERE tr_id=%s;", (i['tr_id'],))
                        #     result = cursor.fetchone()
                        #     max_st_num = result['max_st_num']

                        #     if i['st_num'] < max_st_num:
                        #         tr_ok.append(i['tr_id'])

                        # tr_ok = sorted(tr_ok)
                    
                    # cursor.execute("INSERT INTO st_classtime (st_id, classtime_id, tr_id, class_date) VALUES (%s, %s, %s, %s)", 
                    #                (user_id, classtime_id, tr_ok[0], classroomDateSelect))
                    

                    connection.commit()
        finally:
            connection.close()
        return redirect(url_for('index'))
    return redirect(url_for('login'))


@app.route("/scheduleButton", methods=['POST'])
def scheduleButton():
    if request.method == 'POST':
        user_id = session.get('user_id')
        classroomAreaSelect = request.form['classroomAreaSelect']
        classroomSelect = request.form['classroomSelect']
        class_date = datetime.strptime(request.form['classDate'], '%Y-%m-%d')
        timeslotSelect = request.form['timeslotSelect'].split()
        classNumSelect = int(request.form['classNumSelect'])
        class_week = timeslotSelect[0][-1]
        start_time = timeslotSelect[1][:5]
        end_time = timeslotSelect[1][6:]

        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT count(attend_id) as semester FROM attend WHERE user_id=%s AND (status='1' OR status='3')", (user_id))
            result = cursor.fetchone()
            semester = result['semester'] // 20 + 1
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT classtime_id FROM classroom_schedule WHERE classroom_name=%s AND class_week=%s AND start_time=%s AND end_time=%s;", 
                                (classroomSelect, class_week, start_time, end_time))
            result = cursor.fetchone()
            classtime_id = result['classtime_id']

        for i in range(classNumSelect):
            with connection.cursor() as cursor:
                cursor.execute("INSERT INTO `attend`(`semester`, `user_id`, `classtime_id`, `class_date`) VALUES (%s, %s, %s, %s)", 
                                (semester, user_id, classtime_id, class_date))
            connection.commit()
            class_date += timedelta(days=7)       
        return redirect(url_for('index'))
    return redirect(url_for('login'))

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

            # 將二進制數據編碼為 Base64 字符串
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
            # 將二進制數據編碼為 Base64 字符串
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

        # 初始化当前选中的课程列表
        current_course_val = []

        # 连接数据库
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 更新用户信息
            cursor.execute("""
                UPDATE `users` 
                SET `acc`=%s, `pwd`=%s, `name`=%s, `age`=%s, `address`=%s, `phone1`=%s, `phone2`=%s, `email`=%s 
                WHERE `user_id`=%s
            """, (tr_acc, tr_pwd, tr_name, tr_age, tr_address, tr_phone1, tr_phone2, tr_email, tr_id))
            connection.commit()

            # 更新可接納學生數
            cursor.execute("UPDATE `teachers` SET `st_num`=%s,`status`=%s WHERE `user_id`=%s AND `classtime_id`=%s", (tr_st_num, "1", tr_id, tr_classtime_id))
            connection.commit()


            # 获取当前已选课程
            cursor.execute("SELECT course_id FROM `tr_course` WHERE user_id=%s;", (tr_id,))
            result = cursor.fetchall()
            for i in result:
                current_course_val.append(i['course_id'])

            # 找出新增的课程
            if tr_course_val_choose != current_course_val:
                new_course = set(tr_course_val_choose) - set(current_course_val)

                # 批量插入新增的课程
                insert_query = "INSERT INTO `tr_course` (`user_id`, `course_id`) VALUES (%s, %s)"
                cursor.executemany(insert_query, [(tr_id, int(i)) for i in sorted(new_course)])
                connection.commit()

        # 返回渲染的模板，确保变量的明确传递
        return redirect(url_for('tr_manage'))
    else:
        return redirect(url_for('login'))

@app.route('/leaveTeacherButton', methods=['POST'])
def leaveTeacherButton():
    if request.method == 'POST':
        tr_id = request.form['tr_id']
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 更新用户信息
            cursor.execute("DELETE FROM `teachers` WHERE tr_id=%s;", (tr_id))
            connection.commit()
        return redirect(url_for('tr_manage'))
    else:
        return redirect(url_for('login'))

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
        
         # 預設圖片
        with open('templates/assets/img/avatar/avatar-4.png', 'rb') as file:
            picture = file.read()
        

        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 新增老師資料
            cursor.execute("""INSERT INTO `users`(`acc`, `pwd`, `name`, `age`, `address`, `phone1`, `phone2`, `email`, `picture`, `create_date`, `role`, `status`) 
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""", 
                           (tr_acc, tr_pwd, tr_name, tr_age, tr_address, tr_phone1, tr_phone2, tr_email, picture, datetime.today(), "3", "1"))
            connection.commit()

            cursor.execute("SELECT user_id FROM `users` ORDER BY `user_id` DESC LIMIT 1;")
            result = cursor.fetchone()
            tr_id = result['user_id']

            for i in tr_classtime_id:
                cursor.execute("INSERT INTO `teachers`(`user_id`, `classtime_id`, `st_num`, `status`) VALUES (%s, %s, %s, %s)", 
                           (tr_id, i, tr_st_num, "1"))
                connection.commit()
                
            for i in tr_course_id:
                cursor.execute("INSERT INTO `tr_course`(`user_id`, `course_id`) VALUES (%s, %s)", (tr_id, i))
                connection.commit()
        return redirect(url_for('tr_manage'))
    else:
        return redirect(url_for('login'))


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


@app.route('/tr_insetTimeButton', methods=['POST'])
def tr_insetTimeButton():
    if request.method == 'POST':
        tr_id = request.form['search_tr_id']
        tr_classtimeid_choose_search = [int(i) for i in request.form['tr_classtimeid_choose_search'].split(',')]
        tr_st_num_insert = int(request.form['tr_st_num_insert'])
        connection = get_db_connection()
        with connection.cursor() as cursor:
            for i in tr_classtimeid_choose_search:
                cursor.execute("INSERT INTO `teachers`(`user_id`, `classtime_id`, `st_num`, `status`) VALUES (%s, %s, %s, %s)", (tr_id, i, tr_st_num_insert, '1'))
                connection.commit()
        return redirect(url_for('tr_manage'))
    return redirect(url_for('login'))

# 單堂請假/全部退選
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
                semester = result['semester']
                classtime_id = result['classtime_id']
                cursor.execute("DELETE FROM `attend` WHERE semester=%s AND user_id=%s AND classtime_id=%s AND status='';", (semester, user_id, classtime_id,))
        
        connection.commit()
        connection.close()
            
        return redirect(url_for('index'))
    return redirect(url_for('login'))


# 個人簡介
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
        # 將二進制數據編碼為 Base64 字符串
        encoded_img = base64.b64encode(picture_data).decode('utf-8')
        # 構建適用於前端的 Base64 數據 URL
        picture = f"data:{mime_type};base64,{encoded_img}"

        with connection.cursor() as cursor:
            cursor.execute("SELECT semester FROM `attend` WHERE user_id=%s ORDER BY `semester` DESC LIMIT 1;", (user_id))
            # connection.commit()  # 確保插入操作被提交
            result = cursor.fetchone()
            semester = result['semester']

        # 總共請假幾次
        with connection.cursor() as cursor:
            cursor.execute("SELECT count(attend_id) as leave_num FROM `attend` WHERE user_id=%s AND semester=%s AND status='2'", (user_id, semester))
            result = cursor.fetchone()
            leave_num = result['leave_num']

        # 總共上了多少課(含曠課)
        with connection.cursor() as cursor:
            cursor.execute("SELECT count(attend_id) as class_num FROM `attend` WHERE user_id=%s AND semester=%s AND (status='1' OR status='3')", (user_id, semester))
            result = cursor.fetchone()
            class_num = result['class_num']

        # 找出這學期第一次上課的日期 去計算結束日期
        with connection.cursor() as cursor:
            cursor.execute("SELECT class_date FROM `attend` WHERE user_id=%s AND semester=%s  ORDER BY class_date ASC LIMIT 1;", (user_id, semester))
            result = cursor.fetchone()
            start_class_date = result['class_date']
            end_class_date = start_class_date + timedelta(days=168)
        
        attend_data = []
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM `attend_view` WHERE st_id=%s AND semester=%s AND status != '' ORDER BY class_date ASC;", (user_id, semester))
            result = cursor.fetchall()
        # start_class_date = result['class_date']
        # end_class_date = start_class_date + timedelta(days=168)
        
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

        connection.close()  # 確保連接被關閉


        return render_template("profiles.html", **locals())
    
    else:
        # 未登入狀態下的處理
        return redirect(url_for('login'))

@app.route("/tr_profiles")
def tr_profiles():
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
        # 將二進制數據編碼為 Base64 字符串
        encoded_img = base64.b64encode(picture_data).decode('utf-8')
        # 構建適用於前端的 Base64 數據 URL
        picture = f"data:{mime_type};base64,{encoded_img}"

        with connection.cursor() as cursor:
            cursor.execute("SELECT semester FROM `attend` WHERE user_id=%s ORDER BY `semester` DESC LIMIT 1;", (user_id))
            # connection.commit()  # 確保插入操作被提交
            result = cursor.fetchone()
            semester = result['semester']

        # 總共請假幾次
        with connection.cursor() as cursor:
            cursor.execute("SELECT count(attend_id) as leave_num FROM `attend` WHERE user_id=%s AND semester=%s AND status='2'", (user_id, semester))
            result = cursor.fetchone()
            leave_num = result['leave_num']

        # 總共上了多少課(含曠課)
        with connection.cursor() as cursor:
            cursor.execute("SELECT count(attend_id) as class_num FROM `attend` WHERE user_id=%s AND semester=%s AND (status='1' OR status='3')", (user_id, semester))
            result = cursor.fetchone()
            class_num = result['class_num']

        # 找出這學期第一次上課的日期 去計算結束日期
        with connection.cursor() as cursor:
            cursor.execute("SELECT class_date FROM `attend` WHERE user_id=%s AND semester=%s  ORDER BY class_date ASC LIMIT 1;", (user_id, semester))
            result = cursor.fetchone()
            start_class_date = result['class_date']
            end_class_date = start_class_date + timedelta(days=168)
        
        attend_data = []
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM `attend_view` WHERE st_id=%s AND semester=%s AND status != '' ORDER BY class_date ASC;", (user_id, semester))
            result = cursor.fetchall()
        # start_class_date = result['class_date']
        # end_class_date = start_class_date + timedelta(days=168)
        
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

        connection.close()  # 確保連接被關閉


        return render_template("profiles.html", **locals())
    
    else:
        # 未登入狀態下的處理
        return redirect(url_for('login'))


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
            base64_data = match.group(2)  # Base64 编码的数据
            picture_data = base64.b64decode(base64_data)  # 解码为二进制数据
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

            # 將二進制數據編碼為 Base64 字符串
            encoded_img = base64.b64encode(picture_data).decode('utf-8')
            # 構建適用於前端的 Base64 數據 URL
            picture = f"data:{mime_type};base64,{encoded_img}"

            with connection.cursor() as cursor:
                cursor.execute("SELECT cert_name, cert_program, cert_date, cert_status FROM cert_view WHERE user_id = %s ORDER BY `cert_date` ASC;", (user_id))
                result = cursor.fetchall()
                cert_record = []

                for i in result:
                    cert_record.append({
                        'cert_name': i['cert_name'],
                        'cert_program': i['cert_program'],
                        'cert_date': i['cert_date'],
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

@app.route("/cert_updateDataButton", methods=['POST'])
def cert_updateDataButton():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '1':
        cert_name = request.form.get('cert_name_hidden')
        cert_program = request.form.get('cert_program_hidden')
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


@app.route("/leaveButton", methods=['POST'])
def leaveButton():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    role = session.get('role')

    if login_status == "True" and  role == '1':
        leaveDate = datetime.strptime(request.form.get('leaveDate'), '%Y-%m-%d')
        endDate = datetime.strptime(request.form.get('endDate'), '%Y-%m-%d')

        connection = get_db_connection()
        with connection.cursor() as cursor:
                cursor.execute("SELECT semester FROM `attend` WHERE user_id=%s ORDER BY `semester` DESC LIMIT 1;", (user_id,))
                result = cursor.fetchone()
                semester = result['semester']

        with connection.cursor() as cursor:
            cursor.execute("UPDATE `attend` SET `status`=2 WHERE semester=%s AND class_date BETWEEN %s AND %s;",
                (semester, leaveDate, endDate)
            )
            connection.commit()

        return redirect(url_for('index'))
    else:
        return redirect(url_for('login'))



# 登入
@app.route('/login', methods=['GET', 'POST'])
def login():
    session['login_status'] = ""
    if request.method == 'POST':
        acc = request.form['acc']
        pwd = request.form['pwd']

        try:
            connection = get_db_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE acc=%s AND pwd=%s AND pwd !='' AND LENGTH(acc) = %s AND LENGTH(pwd) = %s;", (acc, pwd, len(acc), len(pwd)))
                result = cursor.fetchone()
            if result:
                if result['status'] != '2':
                    session['login_status'] = "True"
                    session['user_id'] = result['user_id']
                    session['role'] = result['role']
                    session['status'] = result['status']

                    if session['role'] == '1':  # 學生
                        return redirect(url_for('index'))
                    
                    elif session['role'] == '3':  # 老師
                        return redirect(url_for('tr_index'))
                    
                    elif session['role'] == '4':  # 管理員
                        return redirect(url_for('ad_index')) 
                else:
                    # 用户被停权
                    session.clear()  # 清空会话
                    session['login_status'] = "False"
                    session['status'] = "2"
                    return render_template("login.html")  # 在此页面显示模态框

            else:
                # 用户信息无效，显示模态框1
                session.clear()  # 清空会话
                session['login_status'] = "False"
                return render_template("login.html")  # 在此页面显示模态框

        except Exception as e:
            return render_template("login.html", error="發生錯誤，請再試一次。")
        finally:
            connection.close()
    
    return render_template("login.html")


# 登出
@app.route('/logout')
def logout():
    session.clear()  # 清除会话
    return redirect(url_for('login'))

# 防止瀏覽器快存 避免登出後按返回還能看到系統 
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response


if __name__ == "__main__":
    app.debug = True
    app.run()

# if __name__ == "__main__":
#     try:
#         app.run()
#     except (KeyboardInterrupt, SystemExit):
#         scheduler.shutdown()