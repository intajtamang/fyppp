from flask import Flask, render_template, request, redirect, url_for, flash, session
import sqlite3
import bcrypt
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
app.secret_key = 'Int@#12$7'

#-----------------------------------------------------------------------------------

def create_connection():
    conn = sqlite3.connect('users.db')
    return conn

def create_table(conn):
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT
        )
    ''')
    conn.commit()

def register_user(email, password):
    conn = create_connection()
    cursor = conn.cursor()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cursor.execute('INSERT INTO users (email, password) VALUES (?, ?)', (email, hashed_password))
    conn.commit()
    conn.close()

def authenticate_user(email, password):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()
    if user and bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
        return True
    return False

# Function to update password in the database
def update_password(email, new_password):
    conn = create_connection()
    cursor = conn.cursor()
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cursor.execute('UPDATE users SET password = ? WHERE email = ?', (hashed_password, email))
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        try:
            register_user(email, password)
            flash('Registration successful! You can now login.', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Email already exists. Please use a different email.', 'error')
            return redirect(url_for('register'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        if authenticate_user(email, password):
            session['email'] = email
            flash('Login successful!', 'success')
            return redirect(url_for('home'))  # Redirect to home page after successful login
        else:
            flash('Invalid email or password. Please register if you are not already a user.', 'error')
            return redirect(url_for('register'))  # Redirect to registration page if authentication fails
    return render_template('login.html')

@app.route('/home')
def home():
    return render_template('home.html')

# Function to generate OTP
def generate_otp():
    return ''.join(random.choices('0123456789', k=6))

# Function to send email with OTP
def send_otp_email(email, otp):
    sender_email = 'intajtamang@gmail.com'  # Update with your email
    sender_password = 'sgelplfadjkteqod'  # Update with your email password
    subject = 'Password Reset OTP'

    message = MIMEMultipart()
    message['From'] = sender_email
    message['To'] = email
    message['Subject'] = subject

    body = f'Your OTP for password reset is: {otp}'

    message.attach(MIMEText(body, 'plain'))

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, email, message.as_string())

# Your existing route for forget password
@app.route('/forget_password', methods=['GET', 'POST'])
def forget_password():
    if request.method == 'POST':
        email = request.form['email']

        # Generate OTP
        otp = generate_otp()

        # Send email with OTP
        send_otp_email(email, otp)

        # Store OTP in session for verification
        session['otp'] = otp
        session['email'] = email

        flash('An OTP has been sent to your email. Please check and enter it to reset your password.', 'success')
        return redirect(url_for('verify_otp'))

    return render_template('forget_password.html')

# New route for OTP verification
@app.route('/verify_otp', methods=['GET', 'POST'])
def verify_otp():
    if 'otp' not in session or 'email' not in session:
        return redirect(url_for('forget_password'))

    if request.method == 'POST':
        entered_otp = request.form['otp']
        if entered_otp == session['otp']:
            # If OTP is correct, redirect to reset password page
            return redirect(url_for('reset_password'))
        else:
            flash('Invalid OTP. Please try again.', 'error')

    return render_template('verify_otp.html')

# New route for resetting password
@app.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    if 'email' not in session:
        return redirect(url_for('forget_password'))

    if request.method == 'POST':
        new_password = request.form['password']
        email = session['email']

        # Update password in the database
        update_password(email, new_password)

        flash('Password reset successfully!', 'success')
        session.pop('otp')
        session.pop('email')
        return redirect(url_for('login'))

    return render_template('reset_password.html')

if __name__ == '__main__':
    conn = create_connection()
    create_table(conn)
    conn.close()
    app.run(debug=True)
