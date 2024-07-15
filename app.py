import os
from flask import Flask, render_template, request, abort, session, redirect, url_for
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
@app.route("/index", methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        login_status = request.form.get("login_status")
        session['login_status'] = login_status
        if login_status == "True":
            return render_template("index.html")
        else:
            return redirect(url_for('login'))
    else:
        login_status = session.get('login_status')
        if login_status == "True":
            return render_template("index.html", login_status=login_status)
        else:
            return redirect(url_for('login'))
    
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
    login_status = ''
    if request.method == 'POST':
        acc = request.form['acc']
        pwd = request.form['pwd']
        connection = pymysql.connect(host=db_host,
                                     user=db_user,
                                     password=db_pwd,
                                     db=db_name,
                                     cursorclass=pymysql.cursors.DictCursor)
        try:
            # Execute the SQL query to fetch user details
            with connection.cursor() as cursor:
                sql = "SELECT * FROM users WHERE acc=%s AND pwd=%s"
                cursor.execute(sql, (acc, pwd))
                result = cursor.fetchone()
                if result:
                    return render_template("index.html", login_status=True)
                else:
                    login_status = False
        except Exception as e:
            # Handle exceptions
            login_status = False
        finally:
            # Close the database connection
            connection.close()
    return render_template("login.html", login_status=login_status)
    # return render_template("login.html", **locals())

if __name__ == '__main__':
    app.run(debug=True)