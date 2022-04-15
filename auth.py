# auth.py

from flask import Blueprint, render_template, redirect, url_for, request, flash, Flask
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_login import login_user, logout_user, login_required, current_user
from .models import User
from . import db
import os
import urllib.request
import base64

UPLOAD_FOLDER = 'static/images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app = Flask(__name__)
app.config['SECRET_KEY'] = '9OLWxND4o83j4K4iuopO'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SECRET_KEY'] = '9OLWxND4o83j4K4iuopO'

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

auth = Blueprint('auth', __name__)

@auth.route('/login')
def login():
    return render_template('login.html')

@auth.route('/login', methods=['POST'])
def login_post():
    email = request.form.get('email')
    password = request.form.get('password')
    remember = True if request.form.get('remember') else False

    user = User.query.filter_by(email=email).first()

    # check if user actually exists
    # take the user supplied password, hash it, and compare it to the hashed password in database
    if not user or not check_password_hash(user.password, password): 
        flash('Please check your login details and try again.')
        return redirect(url_for('auth.login')) # if user doesn't exist or password is wrong, reload the page

    # if the above check passes, then we know the user has the right credentials
    login_user(user, remember=remember)

    return redirect(url_for('main.profile'))


@auth.route('/signup')
def signup():
    return render_template('signup.html')

@auth.route('/signup', methods=['POST'])
def signup_post():

    email = request.form.get('email')
    name = request.form.get('name')
    password = request.form.get('password')
    

    user = User.query.filter_by(email=email).first() # if this returns a user, then the email already exists in database

    if user: # if a user is found, we want to redirect back to signup page so user can try again  
        flash('Email address already exists')
        return redirect(url_for('auth.signup'))

    # create new user with the form data. Hash the password so plaintext version isn't saved.
    new_user = User(email=email, name=name, card="Empty",password=generate_password_hash(password, method='sha256'))

    # add the new user to the database
    db.session.add(new_user)
    db.session.commit()

    if 'file' not in request.files:
        flash('No file part')


    file = request.files['file']
    if file.filename == '':

        photo_base64 = request.form.get('photo_cap')
        header, encoded = photo_base64.split(",", 1)
        binary_data = base64.b64decode(encoded)
        image_name = name +'.jpg'

        with open(os.path.join(app.config['UPLOAD_FOLDER'],image_name), "wb") as f:
            f.write(binary_data)

    else:
        if file and allowed_file(file.filename):
            filename = name +'.jpg'
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            #print('upload_image filename: ' + filename)
        else:
            flash('Allowed image types are -> png, jpg, jpeg, gif')

    return redirect(url_for('auth.login'))

@auth.route('/card', methods=['POST'])

def card_post():
    card = request.form.get('card')
    username = current_user.name
    user = User.query.filter_by(name=username).first()
    login_user(user, remember=True)

    user.card = card

    db.session.commit()

    return redirect(url_for('main.profile'))


@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))