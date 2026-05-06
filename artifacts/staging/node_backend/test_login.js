const authController = require('./controllers/authController');

const req = {
    body: {
        email: 'admin@gmail.com',
        password: 'password123' 
    },
    session: {}
};

const res = {
    render: (view, data) => { console.log('RENDER', view, data); process.exit(0); },
    redirect: (url) => { console.log('REDIRECT', url); process.exit(0); }
};

async function test() {
    await authController.login(req, res);
}
test().catch(err => { console.error(err); process.exit(1); });
