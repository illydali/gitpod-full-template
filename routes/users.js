const express = require("express");
const router = express.Router();
const crypto = require('crypto');

// using nodejs built in crypto module to hash users password
const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

// import in the User model
const {
    User
} = require('../models');

const {
    createRegistrationForm,
    bootstrapField,
    createLoginForm
} = require('../forms');

router.get('/register', (req, res) => {
    // display the registration form
    const registerForm = createRegistrationForm();
    res.render('users/register', {
        'form': registerForm.toHTML(bootstrapField)
    })
})

router.post('/register', (req, res) => {
    const registerForm = createRegistrationForm();
    registerForm.handle(req, {
        success: async (form) => {
            const user = new User({
                'username': form.data.username,
                'password': getHashedPassword(form.data.password),
                'email': form.data.email
            });
            await user.save();
            req.flash("success_messages", "User signed up successfully!");
            res.redirect('/')
        },
        'error': (form) => {
            // display validation errors to user
            res.render('users/register', {
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})

router.get('/login', (req, res) => {
    const loginForm = createLoginForm();
    res.render('users/login', {
        'form': loginForm.toHTML(bootstrapField)
    })
})

router.post('/login', (req, res) => {
    const loginForm = createLoginForm();
    loginForm.handle(req, {
        'success': async function (form) {
            // 1. check that the email is registered .. 
            // meaning it exists in the user table
            let user = await User.where({
                'email': form.data.email
            }).fetch({
                require: false
            })

            if (!user) {
                req.flash('error_messages', `Sorry your login details are wrong`)
                res.redirect('/users/login')
            } else {
                // 2. if the user exists, check if the password matches the entered password
                if (user.get('password') === getHashedPassword(form.data.password)) {

                    // store the user info in the section
                    req.session.user = {
                        'id': user.get('id'),
                        'username': user.get('username'),
                        'email': user.get('email')
                    }

                    req.flash('success_messages', `Welcome back, ` + user.get('username'));
                    res.redirect('/users/profile');

                } else {

                    req.flash('error_messages', `Sorry your login details are incorrect`)
                    res.redirect('/users/login')
                }
            }
        },
        'error': function (form) {
            req.flash("error_messages", "There are some problems logging you in. Please fill in the form again")
            res.render('/users/login', {
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})

router.get('/profile', async (req,res) => {
    const user = req.session.user;
    if (!user) {
        req.flash('error_messages' , `You do not have permission to be here`)
        res.redirect('/users/login')
    } else {
        let user = await User.where({
            'id' : req.session.user.id
        }).fetch({
            'required' : true
        })

        res.render('users/profile' , {
            'user' : user.toJSON()
        })
    }
})

router.get('/logout', (req,res) => {
    req.session.user = null;
    req.flash('success_messages', "Goodbye and see you again");
    res.redirect('/users/login');
})

module.exports = router;