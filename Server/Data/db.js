import bcrypt from 'bcryptjs';


const users = [
    {
        id: 1,
        username : 'john', 
        email : "user@gmail.com",
        password : bcrypt.hashSync("password123", 10),
        role : 'user'
    },
    {
        id: 2,
        username : 'jane',
        email : "admin@gmail.com",
        password : bcrypt.hashSync("password456", 10),
        role : 'admin'
    },
];

const products = [
    {
        id : 1,
        name : 'Laptop',
        price : 999.99
    },
    {
        id : 2,
        name : 'Smartphone',
        price : 499.99
    },
    {
        id : 3,
        name : 'Headphones',
        price : 199.99
    },
    {
        id : 4,
        name : 'Smartwatch',
        price : 299.99
    },
    {
        id : 5,
        name : 'Tablet',
        price : 399.99
    },
    {
        id : 6,
        name : 'Camera',
        price : 599.99
    }
]

let refreshTokens = []

export { users, products, refreshTokens }