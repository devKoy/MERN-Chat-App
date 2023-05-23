import('crypto-random-string').then((module) => {
    const randomString = module.default;
    // Generate a 32-character random string as the secret key
    const jwtSecret = randomString({
        length: 32
    });

    console.log(jwtSecret);
}).catch((error) => {
    console.error(error);
});