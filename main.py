# main.py

from flask import Blueprint, render_template
from flask_login import login_required, current_user
from os import listdir
from os.path import isfile, join
import os

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/profile')
@login_required
def profile():
    print(current_user.card)
    if current_user.card == "Empty":
        return render_template('profile.html', name=current_user.name, img_name=f'images/{current_user.name}.jpg', card="Empty")
    else:
        return render_template('profile.html', name=current_user.name, img_name=f'images/{current_user.name}.jpg' ,card=current_user.card)

@main.route('/sim')
@login_required
def sim():
    labels_path = 'static/images/'
    labels = [f.replace('.jpg','') for f in listdir(labels_path) if isfile(join(labels_path, f))]
    #labels = [current_user.name]
    return render_template("sim.html", labels=labels)
