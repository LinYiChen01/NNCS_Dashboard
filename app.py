import os
import base64
import filetype
from flask import Flask, render_template, request, abort, session, redirect, url_for, make_response
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
# db_host = 'localhost'
# db_user = 'root'
# db_pwd = ''
# db_name = 'nncs'
def get_db_connection():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='',
        db='nncs',
        cursorclass=pymysql.cursors.DictCursor)

# 圖片大小限制 (16MB)
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


@app.route('/a', methods=['GET', 'POST'])
def a():
    img_data = None  # 初始化圖片資料變數
    msg = ''
    connection = get_db_connection()
    with connection.cursor() as cursor:
        sql = "SELECT picture FROM users WHERE user_id = 1"
        cursor.execute(sql)
        result = cursor.fetchone()
        kind = filetype.guess(result['picture'])
        if result and result['picture']:
            # 將圖片轉換為 base64 編碼格式
            encoded_img = base64.b64encode(result['picture']).decode('utf-8')
            img_data = f"data:{kind.mime};base64,{encoded_img}"  # 使用動態的 MIME 類型
        else:
            msg = '您尚未上傳任何圖片!'
    connection.close()  # 確保連接被關閉

    if request.method == 'POST':
        file = request.files['file']
        if file.filename != '':
            file_size = request.content_length
            print(file_size)
            if file_size > MAX_CONTENT_LENGTH:
                msg = f'上傳圖片過大，圖片大小最大為 {MAX_CONTENT_LENGTH / 1024} KB。'
                return render_template("a.html", msg=msg)
            photo_data = file.read()  # 讀取圖片並將其轉換為二進位資料
            # 使用 filetype 模块确定图片的类型
            kind = filetype.guess(photo_data)
            if kind is None or kind.extension not in ['jpg', 'jpeg', 'png', 'webp']:
                msg = '僅能上傳圖片副檔名為: jpg、jpeg、png、webp'
                return render_template("a.html", msg=msg)
            
            mime_type = kind.mime  # 動態設置 MIME 類型
            
            # connection = pymysql.connect(
            #     host=db_host,
            #     user=db_user,
            #     password=db_pwd,
            #     db=db_name,
            #     cursorclass=pymysql.cursors.DictCursor
            # )
            connection = get_db_connection()
            with connection.cursor() as cursor:
                sql = "UPDATE `users` SET `picture` = %s WHERE `users`.`user_id` = 1;"
                cursor.execute(sql, (photo_data,))
                connection.commit()  # 確保插入操作被提交

                # 提取剛剛上傳的圖片
                sql = "SELECT picture FROM users WHERE user_id = 1"
                cursor.execute(sql)
                result = cursor.fetchone()
                if result and result['picture']:
                    # 將圖片轉換為 base64 編碼格式
                    encoded_img = base64.b64encode(result['picture']).decode('utf-8')
                    img_data = f"data:{mime_type};base64,{encoded_img}"  # 使用動態的 MIME 類型
                    msg = ''
            connection.close()  # 確保連接被關閉
    return render_template("a.html", **locals())

# index 首頁
@app.route("/")
@app.route('/index', methods=['GET', 'POST'])
def index():
    login_status = session.get('login_status')
    # 確認登入訊息是否成功
    if login_status == "True":
        access_token = session.get('access_token')
        # return render_template("index.html", login_status=login_status, access_token=access_token) 
        # connection = pymysql.connect(host=db_host,
        #                                  user=db_user,
        #                                  password=db_pwd,
        #                                  db=db_name,
        #                                  cursorclass=pymysql.cursors.DictCursor)
        # try:
        #     with connection.cursor() as cursor:
        #         sql = "SELECT name FROM courses"
        #         cursor.execute(sql)
        #         courses = cursor.fetchall()
        # finally:
        #     connection.close()
        return render_template("index.html", **locals())
    else:
        return render_template("login.html")

@app.route("/index0")
def index0():
    # return render_template("index0.html", **locals())
    login_status = session.get('login_status')
    # 確認登入訊息是否成功
    if login_status == "True":
        access_token = session.get('access_token')
        # return render_template("index0.html", login_status=login_status, access_token=access_token) 
        return render_template("index0.html", **locals())
    else:
        return render_template("login.html")

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        login_method = request.form.get('login_method')
        if login_method == "google":
            login_status = request.form.get("login_status")
            session['login_status'] = login_status
            session['login_method'] = login_method
            access_token = request.form.get("access_token")
            session['access_token'] = access_token
            # session['user_info'] = json.loads(request.form.get("user_info"))
            user_info = json.loads(request.form.get("user_info"))

            # session['user_info'] = user_info
            # 提取姓名
            names = user_info['names']
            if names:
                display_name = names[0]['displayName']  # 取得顯示名稱
                family_name = names[0].get('familyName', '')  # 取得姓氏
                given_name = names[0].get('givenName', '')  # 取得名字
                full_name = f"{given_name} {family_name}" if given_name and family_name else display_name
                session['name'] = display_name

            # 提取頭像
            photos = user_info['photos']
            if photos:
                photo_url = photos[0]['url']  # 取得頭像 URL
                session['photo'] = photo_url

            # 提取郵件地址
            email_addresses = user_info['emailAddresses']
            if email_addresses:
                email = email_addresses[0]['value']  # 取得郵件地址
                session['email'] = email
            
            # connection = pymysql.connect(host=db_host,
            #                              user=db_user,
            #                              password=db_pwd,
            #                              db=db_name,
            #                              cursorclass=pymysql.cursors.DictCursor)
            connection = get_db_connection()
            with connection.cursor() as cursor:
                        sql = "SELECT * FROM users WHERE acc=%s"
                        cursor.execute(sql, (email))
                        result = cursor.fetchone()
                        if result:
                            session['login_status'] = "True"
                            # return redirect(url_for('index'))
                        else:
                            sql = "INSERT INTO users (acc, name, email, picture) VALUES (%s, %s, %s, %s)"
                            cursor.execute(sql, (email, full_name, email, photo_url))
                            connection.commit()  # 确保插入操作被提交
                            session['login_status'] = "True"
                            # return redirect(url_for('index'))           
            if login_status == "True":
                # return render_template("index.html", session=session) 
                return render_template("index.html", **locals()) 
            else:
                # return redirect(url_for('login'))
                response = make_response(render_template("login.html"))
                response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
                response.headers["Pragma"] = "no-cache"
                response.headers["Expires"] = "0"
                return response
        else:
            acc = request.form['acc']
            pwd = request.form['pwd']
            # connection = pymysql.connect(host=db_host,
            #                              user=db_user,
            #                              password=db_pwd,
            #                              db=db_name,
            #                              cursorclass=pymysql.cursors.DictCursor)
            try:
                # Execute the SQL query to fetch user details
                connection = get_db_connection()
                with connection.cursor() as cursor:
                    sql = "SELECT * FROM users WHERE acc=%s AND pwd=%s AND pwd !=''"
                    cursor.execute(sql, (acc, pwd))
                    result = cursor.fetchone()
                    if result:
                        session['login_status'] = "True"
                        session['name'] = result['name']
                        return redirect(url_for('index'))
                login_status = "False"
            except Exception as e:
                print(f"Database error: {e}")
                login_status = "False"
            finally:
                # Close the database connection
                connection.close()
            return render_template("login.html", login_status=login_status)
            # return render_template("index.html", **locals()) 
    
    # return render_template("login.html")
    # response = make_response(render_template("login.html"))
    # response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    # response.headers["Pragma"] = "no-cache"
    # response.headers["Expires"] = "0"
    # return response
    return render_template("login.html", **locals())


@app.route('/logout')
def logout():
    session.clear()  # 清除会话
    # response = make_response(render_template("login.html"))
    # response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    # response.headers["Pragma"] = "no-cache"
    # response.headers["Expires"] = "0"
    # return response
    return render_template("login.html")

if __name__ == '__main__':
    app.run(debug=True)