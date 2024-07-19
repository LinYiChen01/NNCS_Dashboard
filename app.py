import os
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
db_host = 'localhost'
db_user = 'root'
db_pwd = ''
db_name = 'nncs'

app = Flask(__name__, static_folder='templates/assets')
app.secret_key = os.urandom(24)  # 随机生成一个24字节的密钥


@app.route("/")
@app.route('/index', methods=['GET', 'POST'])
def index():
    login_status = session.get('login_status')
    if login_status == "True":
        access_token = session.get('access_token')
        # return render_template("index.html", login_status=login_status, access_token=access_token)
        print('sessionfffff')
        print(access_token)
        return render_template("index.html", access_token=access_token)
        
    else:
        return redirect(url_for('login'))
    # if request.method == 'POST':
    #     login_status = request.form.get("login_status")
    #     session['login_status'] = login_status
    #     print(f"POST request received. login_status: {login_status}")
    #     if login_status == "True":
    #         return render_template("index.html")
    #     else:
    #         return redirect(url_for('login'))
    # return request.method
    
    # print(f"GET request received.")
    # login_status = session.get('login_status')
    # if login_status == "True":
    #     return render_template("index.html", login_status=login_status)
    # else:
    #     return redirect(url_for('login'))
# @app.route("/index", methods=['GET', 'POST'])
# def index():
#     if request.method == 'POST':
#         login_status = request.form.get("login_status")
#         session['login_status'] = login_status
#         if login_status == "True":
#             return render_template("index.html")
#         else:
#             return redirect(url_for('login'))
#     print(request.method)
#     return redirect(url_for('login'))
    # else:
    #     login_status = session.get('login_status')
    #     if login_status == "True":
    #         return render_template("index.html", login_status=login_status)
    #     else:
    #         return redirect(url_for('login'))
    
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

@handler.add(MessageEvent, message=TextMessageContent)
def handle_message(event):
    user_input = event.message.text  # 獲取用戶輸入的訊息（帳號）

    # 連接到資料庫
    try:
        connection = pymysql.connect(host=db_host,
                                     user=db_user,
                                     password=db_pwd,
                                     db=db_name,
                                     cursorclass=pymysql.cursors.DictCursor)
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

@app.route("/index0")
def index0():
    return render_template("index0.html")

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
            user_info = json.loads(request.form.get("user_info"))
            
            # session['user_info'] = user_info
            # 提取姓名

            names = user_info['names']
            if names:
                display_name = names[0]['displayName']  # 取得顯示名稱
                family_name = names[0].get('familyName', '')  # 取得姓氏
                given_name = names[0].get('givenName', '')  # 取得名字
                full_name = f"{given_name} {family_name}" if given_name and family_name else display_name

            # 提取頭像
            photos = user_info['photos']
            if photos:
                photo_url = photos[0]['url']  # 取得頭像 URL

            # 提取郵件地址
            email_addresses = user_info['emailAddresses']
            if email_addresses:
                email = email_addresses[0]['value']  # 取得郵件地址

            print("姓名:", full_name)
            print("頭像 URL:", photo_url)
            print("郵件地址:", email)
            print(session)
            
            # connection = pymysql.connect(host=db_host,
            #                              user=db_user,
            #                              password=db_pwd,
            #                              db=db_name,
            #                              cursorclass=pymysql.cursors.DictCursor)
            # with connection.cursor() as cursor:
            #             sql = "SELECT * FROM users WHERE acc=%s"
            #             cursor.execute(sql, (email, pwd))
            #             result = cursor.fetchone()
            #             if result:
            #                 session['login_status'] = "True"
            #                 return redirect(url_for('index'))

            if login_status == "True":
                return render_template("index.html", session=session) 
            else:
                return redirect(url_for('login'))
        
        else:
            acc = request.form['acc']
            pwd = request.form['pwd']
            connection = pymysql.connect(host=db_host,
                                         user=db_user,
                                         password=db_pwd,
                                         db=db_name,
                                         cursorclass=pymysql.cursors.DictCursor)
            try:
                # Execute the SQL query to fetch user details
                if pwd.strip() == '':
                    with connection.cursor() as cursor:
                        sql = "SELECT * FROM users WHERE acc=%s AND pwd=%s"
                        cursor.execute(sql, (acc, pwd))
                        result = cursor.fetchone()
                        if result:
                            session['login_status'] = "True"
                            return redirect(url_for('index'))
                        # else:
                        #     login_status = "False"
                login_status = "False"
            except Exception as e:
                print(f"Database error: {e}")
                login_status = "False"
            finally:
                # Close the database connection
                connection.close()
            return render_template("login.html", login_status=login_status)
    
    return render_template("login.html", login_status='')
    # return render_template("login.html", **locals())


@app.route('/logout')
def logout():
    session.clear()  # 清除会话
    return render_template("login.html")
    

if __name__ == '__main__':
    app.run(debug=True)