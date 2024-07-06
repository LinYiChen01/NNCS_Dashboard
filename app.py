from flask import Flask, render_template, request
import pymysql.cursors

db_host = 'localhost'
db_user = 'root'
db_pwd = ''
db_name = 'nncs'

app = Flask(__name__, static_folder='templates/assets')

@app.route("/")
@app.route("/index")
def index():
    return render_template("index.html")

@app.route("/index-0")
def index0():
    return render_template("index-0.html")

@app.route('/login', methods=['GET', 'POST'])
def login():
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
                    return render_template("login.html", login_status=False)
        except Exception as e:
            # Handle exceptions
            return render_template("login.html", login_status=False)
        finally:
            # Close the database connection
            connection.close()
    
    return render_template("login.html")

if __name__ == '__main__':
    app.run(debug=True)
