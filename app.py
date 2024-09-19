import os
import base64, re
from datetime import datetime
import filetype
from flask import Flask, render_template, request, abort, session, redirect, url_for, make_response, jsonify
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
        # connection = pymysql.connect(host=db_host,
        #                              user=db_user,
        #                              password=db_pwd,
        #                              db=db_name,
        #                              cursorclass=pymysql.cursors.DictCursor)
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
        print(f"Error: {err}")
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


# @app.route('/a', methods=['GET', 'POST'])
# def a():
#     img_data = None  # 初始化圖片資料變數
#     msg = ''
#     connection = get_db_connection()
#     with connection.cursor() as cursor:
#         sql = "SELECT picture FROM users WHERE user_id = 1"
#         cursor.execute(sql)
#         result = cursor.fetchone()
#         kind = filetype.guess(result['picture'])
#         if result and result['picture']:
#             # 將圖片轉換為 base64 編碼格式
#             encoded_img = base64.b64encode(result['picture']).decode('utf-8')
#             img_data = f"data:{kind.mime};base64,{encoded_img}"  # 使用動態的 MIME 類型
#         else:
#             msg = '您尚未上傳任何圖片!'
#     connection.close()  # 確保連接被關閉

#     if request.method == 'POST':
#         file = request.files['file']
#         if file.filename != '':
#             file_size = request.content_length
#             if file_size > MAX_CONTENT_LENGTH:
#                 msg = f'上傳圖片過大，圖片大小最大為 {MAX_CONTENT_LENGTH / 1024} KB。'
#                 return render_template("a.html", msg=msg)
#             photo_data = file.read()  # 讀取圖片並將其轉換為二進位資料
#             # 使用 filetype 模块确定图片的类型
#             kind = filetype.guess(photo_data)
#             if kind is None or kind.extension not in ['jpg', 'jpeg', 'png', 'webp']:
#                 msg = '僅能上傳圖片副檔名為: jpg、jpeg、png、webp'
#                 return render_template("a.html", msg=msg)
            
#             mime_type = kind.mime  # 動態設置 MIME 類型
            
#             # connection = pymysql.connect(
#             #     host=db_host,
#             #     user=db_user,
#             #     password=db_pwd,
#             #     db=db_name,
#             #     cursorclass=pymysql.cursors.DictCursor
#             # )
#             connection = get_db_connection()
#             with connection.cursor() as cursor:
#                 sql = "UPDATE `users` SET `picture` = %s WHERE `users`.`user_id` = 1;"
#                 cursor.execute(sql, (photo_data,))
#                 connection.commit()  # 確保插入操作被提交

#                 # 提取剛剛上傳的圖片
#                 sql = "SELECT picture FROM users WHERE user_id = 1"
#                 cursor.execute(sql)
#                 result = cursor.fetchone()
#                 if result and result['picture']:
#                     # 將圖片轉換為 base64 編碼格式
#                     encoded_img = base64.b64encode(result['picture']).decode('utf-8')
#                     img_data = f"data:{mime_type};base64,{encoded_img}"  # 使用動態的 MIME 類型
#                     msg = ''
#             connection.close()  # 確保連接被關閉
#     return render_template("a.html", **locals())

# index 首頁
@app.route("/")
@app.route('/index', methods=['GET', 'POST'])
def index():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    class_num = 0
    border_color = ""
    text_color = ""

    if login_status == "True":
        connection = get_db_connection()
        with connection.cursor() as cursor:
            sql = "SELECT name FROM courses"
            cursor.execute(sql)
            courses = cursor.fetchall()

        with connection.cursor() as cursor:
            sql = """
            SELECT
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

            
            for i in range(len(result)):
                classroom_data.append({})
                classroom_data[i]['classroom'] = result[i]['name']
                classroom_data[i]['class_week'] = result[i]['class_week']
                classroom_data[i]['start_time'] = str(result[i]['start_time'])[:-3]
                classroom_data[i]['end_time'] = str(result[i]['end_time'])[:-3]

                classroom.append(result[i]['name'])
                classroom_area.append(result[i]['name'][:2])
                class_week.append(result[i]['class_week'])
                start_time.append(str(result[i]['start_time'])[:-3])
                end_time.append(str(result[i]['end_time'])[:-3])
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
        
        # 查詢用戶的參加課程信息
        with connection.cursor() as cursor:
            cursor.execute("SELECT attend_id, classtime_id, class_date, status FROM attend WHERE user_id=%s", (user_id,))
            attendances = cursor.fetchall()

        event_data = []
        
        # 查詢每個參加課程的詳細信息
        for attendance in attendances:
            fc_attend_id = attendance['attend_id']
            fc_classtime_id = attendance['classtime_id']
            fc_class_date = attendance['class_date']
            fc_status = attendance['status']
            
            

            if fc_status != '2':
                # 曠課(3) -> 紅色
                if fc_status == '3':
                    border_color = "#ef6767"
                    text_color = '#ef6767'
                    class_num += 1
                # '' -> 藍色
                elif fc_status == '':
                    border_color = "#6777ef"
                    text_color = '#6777ef'
                # 上課(1) -> 藍色
                elif fc_status == '1':
                    border_color = "#aaadbf"
                    text_color = '#aaadbf'
                    class_num += 1
                # 停課(4) -> 綠色
                elif fc_status == '4':
                    border_color = "#8bb690"
                    text_color = '#8bb690'
                    class_num += 1
                # 繳費/教材費(4) -> 橘色
                else:
                    border_color = "#efa567"
                    text_color = '#efa567'
                with connection.cursor() as cursor:
                    cursor.execute("SELECT classroom_name, start_time, end_time FROM classroom_schedule WHERE classtime_id=%s", (fc_classtime_id,))
                    result = cursor.fetchone()
                    fc_classroom_name = result['classroom_name']
                    fc_start_time = str(result['start_time'])[:-3]
                    fc_end_time = str(result['end_time'])[:-3]
                    # print(fc_start_time, fc_end_time)

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

        connection.close()
        return render_template("index.html", **locals())
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

        print('classroomDateSelect:', classroomDateSelect)
        print('fc_classroomAreaSelect:', fc_classroomAreaSelect)
        print('fc_classroomSelect:', fc_classroomSelect)
        print('fc_timeslotSelect:', fc_timeslotSelect)
        print('class_week:', class_week)
        print('start_time:', start_time)
        print('end_time:', end_time)
        
        try:
            connection = get_db_connection()
            with connection.cursor() as cursor:
                # 使用檢視表一次查詢所需數據
                cursor.execute("""
                    SELECT classtime_id FROM classroom_schedule 
                    WHERE classroom_name=%s AND class_week=%s AND start_time=%s AND end_time=%s
                """, (fc_classroomSelect, class_week, start_time, end_time))
                result = cursor.fetchone()
                classtime_id = result['classtime_id']
            
                # 插入數據到 attend 表
                try:
                    cursor.execute("SELECT attend_id FROM attend WHERE user_id=%s AND classtime_id=%s AND class_date=%s", 
                                    (user_id, classtime_id, classroomDateSelect))
                    result = cursor.fetchone()
                    attend_id = result['attend_id']
                    cursor.execute("UPDATE attend SET status='' WHERE attend_id=%s;", (attend_id,))
                    connection.commit()
                except:
                    cursor.execute("INSERT INTO attend (user_id, classtime_id, class_date) VALUES (%s, %s, %s)", 
                                   (user_id, classtime_id, classroomDateSelect))
                    connection.commit()
        finally:
            connection.close()
        return redirect(url_for('index'))
    return redirect(url_for('login'))

# 單堂請假/全部退選
@app.route("/fc_leaveButton", methods=['POST'])
def fc_leaveButton():
    if request.method == 'POST':
        # user_id = session.get('user_id')
        # fc_leaveDayDate = request.form['fc_leaveDayDate']
        # fc_leaveWeek = datetime.strptime(fc_leaveDayDate, '%Y-%m-%d').weekday()
        # fc_leaveDayClassroom = request.form['fc_leaveDayClassroom']
        # fc_leaveDayClasstime = request.form['fc_leaveDayClasstime'].split('-')
        # fc_leavestatus = request.form['fc_leavestatus']
        # fc_attend_id = json.loads(request.form['fc_event_data'])
        fc_attend_id = request.form['fc_attend_id']
        # print('fc_attend_id:', fc_attend_id)

        # weekday_zh = ['一', '二', '三', '四', '五', '六', '日']
        # fc_leaveWeek = weekday_zh[fc_leaveWeek]

        # print('user_id', user_id)
        # print('fc_leaveDayDate', fc_leaveDayDate)
        # print('fc_leaveDayClasstime', fc_leaveDayClasstime)
        # print('fc_leavestatus', fc_leavestatus)
        

        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("UPDATE attend SET status='2' WHERE attend_id=%s;", (fc_attend_id,))
        connection.commit()
        connection.close()
            
        return redirect(url_for('index'))
    return redirect(url_for('login'))


# 個人簡介
@app.route("/profiles")
def profiles():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    
    if login_status == "True":
        connection = get_db_connection()
        
        # 查user資料
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s;", (user_id))
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

        with connection.cursor() as cursor:
            cursor.execute("SELECT count(attend_id) as leave_num FROM `attend` WHERE user_id=%s AND semester=%s AND status='2'", (user_id, semester))
            # connection.commit()  # 確保插入操作被提交
            result = cursor.fetchone()
            leave_num = result['leave_num']

        with connection.cursor() as cursor:
            cursor.execute("SELECT count(attend_id) as class_num FROM `attend` WHERE user_id=%s AND semester=%s AND (status='1' OR status='3')", (user_id, semester))
            # connection.commit()  # 確保插入操作被提交
            result = cursor.fetchone()
            class_num = result['class_num']
        
        


        
        
        connection.close()  # 確保連接被關閉


        return render_template("profiles.html", **locals())
    
    else:
        # 未登入狀態下的處理
        return redirect(url_for('login'))

@app.route('/update_profile', methods=['POST'])
def update_profile():
    login_status = session.get('login_status')
    user_id = session.get('user_id')
    
    if login_status == "True":
        phone1 = request.form.get('phone1')
        phone2 = request.form.get('phone2')
        email = request.form.get('email')
        address = request.form.get('address')
        workplace = request.form.get('workplace')
        profession = request.form.get('profession')
        # 處理圖片
        picture = request.files.get('file')
        print(phone1)
        print(phone2)
        print(email)
        print(address)
        print(workplace)
        print(profession)
        

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


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        login_method = request.form.get('login_method')
        if login_method == "google":
            login_status = request.form.get("login_status")
            access_token = request.form.get("access_token")
            user_info = request.form.get("user_info")

            # 初始化 session 變數
            session['login_status'] = "False"
            session['login_method'] = login_method
            session['access_token'] = access_token

            try:
                user_info = json.loads(user_info)
                names = user_info.get('names', [])
                display_name = names[0].get('displayName', '') if names else ''
                family_name = names[0].get('familyName', '') if names else ''
                given_name = names[0].get('givenName', '') if names else ''
                full_name = f"{given_name} {family_name}".strip() or display_name
                session['name'] = display_name

                photos = user_info.get('photos', [])
                photo_url = photos[0].get('url', '') if photos else ''
                session['picture'] = photo_url

                email_addresses = user_info.get('emailAddresses', [])
                email = email_addresses[0].get('value', '') if email_addresses else ''
                session['email'] = email

                # 連接到資料庫
                connection = get_db_connection()
                with connection.cursor() as cursor:
                    # 檢查用戶是否存在
                    cursor.execute("SELECT * FROM users WHERE acc=%s", (email,))
                    result = cursor.fetchone()
                    if result:
                        session['login_status'] = "True"
                    else:
                        # 插入新用戶
                        cursor.execute("INSERT INTO users (acc, name, email, picture) VALUES (%s, %s, %s, %s)",
                                       (email, full_name, email, photo_url))
                        connection.commit()
                        session['login_status'] = "True"
                connection.close()

                if session['login_status'] == "True":
                    return redirect(url_for('index'))
                else:
                    return render_template("login.html", **locals())
            except Exception as e:
                print(f"處理 Google 登入時出錯: {e}")
                return render_template("login.html", error="登入失敗，請再試一次。")
        
        else:
            acc = request.form['acc']
            pwd = request.form['pwd']

            try:
                connection = get_db_connection()
                with connection.cursor() as cursor:
                    cursor.execute("SELECT * FROM users WHERE acc=%s AND pwd=%s AND pwd !=''", (acc, pwd))
                    result = cursor.fetchone()
                    if result:
                        session['login_status'] = "True"
                        session['user_id'] = result['user_id']
                        return redirect(url_for('index'))
                    else:
                        session['login_status'] = "False"
                        return render_template("login.html", error="憑證無效，請再試一次。")
            except Exception as e:
                print(f"資料庫錯誤: {e}")
                return render_template("login.html", error="發生錯誤，請再試一次。")
            finally:
                connection.close()
    
    return render_template("login.html")



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


if __name__ == '__main__':
    app.run(debug=True)