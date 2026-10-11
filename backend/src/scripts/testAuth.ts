import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });

async function run() {
  try {
    const reg = await api.post('/auth/register', { email: 'grad@example.com', password: 'Secret123!' });
    console.log('Register response', reg.data);
    const login = await api.post('/auth/login', { email: 'grad@example.com', password: 'Secret123!' });
    console.log('Login token', login.data.token);
  } catch (err:any) {
    if (err.response) {
      console.error('Error', err.response.status, err.response.data);
    } else {
      console.error('Error', err.message);
    }
  }
}

run();
