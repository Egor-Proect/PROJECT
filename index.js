const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public')); // папка с HTML файлами
const mongoose = require('mongoose');

const port = 3005;
app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});

// Подключение к MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/shop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


// СХЕМА ДЛЯ ТОВАРОВ
let productShema = new mongoose.Schema({
    number_id: Number,
    name: String,
    price: Number,
    description: String,
    status: String,
    img: String
})

let products = mongoose.model('product', productShema);

// Обработчик GET-запроса для загрузки формы подключите, например, index.html в корень
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/admin.html');
});
app.post('/add-product', async (req, res) => {
  try {
    const { number_id, name, price, description, status, img } = req.body;
    const newProduct = new products({
      number_id: Number(number_id),
      name: String(name),
      price: Number(price),
      description: String(description),
      status: String(status),
      img: String(img)
    });
    await newProduct.save();
    res.json({ message: 'Продукт успешно добавлен!' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при сохранении', details: err.message });
  }
  console.log(req.body);
});

// Схема и модель аккаунтов
const accountSchema = new mongoose.Schema({
    login: String,
    password: String,
    items: {
        type: [Number],
        default: []
    },
    items_cart: {
        type: [Number],
        default: []
    }
});
const Account = mongoose.model('Account', accountSchema);

//ВЫВОД карточек товаров в main:

app.get('/products', async (req, res) => {
  try {
    const allProducts = await products.find({});
    res.json(allProducts);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});

//ВЫВОД карточек товаров в favorit:

app.get('/favorit_products', async (req, res) => {
  try {
    const allProducts = await products.find({});
    res.json(allProducts);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});

//ВЫВОД карточек товаров в cart:

app.get('/cart_products', async (req, res) => {
  try {
    const allProducts = await products.find({});
    res.json(allProducts);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});

// Отдача главной страницы login.html
app.get('/login.html', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Обработчик авторизации и регистрации
app.post('/auth', async (req, res) => {
    const { login, password, action } = req.body;
    if(!login || !password || !action){
        return res.json({ error: 'Заполните все поля' });
    }

    try {
        if(action === 'register') {
            const existing = await Account.findOne({ login });
            if(existing) {
                return res.json({ error: 'Такой логин уже есть' });
            }
            const newAcc = new Account({ login, password });
            await newAcc.save();
            return res.json({ message: 'Аккаунт успешно зарегистрирован' });
        } else if(action === 'login') {
            const user = await Account.findOne({ login, password });
            if(!user){
                return res.json({ error: 'Неверный логин или пароль' });
            }
            return res.json({ message: 'Вход успешен' });
        } else {
            return res.json({ error: 'Некорректное действие' });
        }
    } catch(err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получить данные пользователя (массив items и items_cart)
app.get('/getUserData', async (req, res) => {
    const login = req.query.login;
    try {
        const user = await Account.findOne({ login });
        if (!user) {
            return res.json({ items: [], items_cart: [] });
        }
        res.json({ items: user.items || [], items_cart: user.items_cart || [] });
    } catch (err) {
        res.json({ error: 'Ошибка на сервере' });
    }
});

// ОБНОВЛЕНИЕ МАССИВОВ КОРЗИНЫ И ИЗБРАННОГО ПОЛЬЗОВАТЕЛЕЙ

app.post('/add-to-favorites', async (req, res) => {
    console.log("APP.POST")
    const { login, number_id } = req.body;
    try {
        const account = await Account.findOne({ login });
        if (!account) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // добавляем number_id в массив items, если его еще там нет
        if (!account.items.includes(Number(number_id))) { // убеждаемся, что число
            account.items.push(Number(number_id));
            await account.save();
        }

        res.json({ message: 'Товар успешно добавлен' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.post('/add_to_cart', async (req, res) => {
    console.log("APP.POST")
    const { login, number_id } = req.body;
    try {
        const account = await Account.findOne({ login });
        if (!account) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // добавляем number_id в массив items_cart, если его еще там нет
        if (!account.items_cart.includes(Number(number_id))) { // убеждаемся, что число
            account.items_cart.push(Number(number_id));
            await account.save();
        }

        res.json({ message: 'Товар успешно добавлен' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Очистка корзина

app.post('/api/clear-cart', async (req, res) => {
  const { login } = req.body;
  try {
    const account = await Account.findOne({ login });
    if (!account) {
      return res.json({ success: false, message: 'Аккаунт не найден' });
    }
    console.log("items_cart до очистки: " + JSON.stringify(account.items_cart));
    account.items_cart = [];
    await account.save();
    console.log("items_cart после очистки: " + JSON.stringify(account.items_cart));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Ошибка на сервере' });
  }
});

// ПОИСКОВИК ТОВАРОВ В main
