CREATE TABLE pictures (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT);
INSERT INTO pictures (source) VALUES ('img1.jpg'), ('img2.jpg'), ('img1.jpg'), ('img2.jpg');

CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, password TEXT);
INSERT INTO users (login, password) VALUES ('admin', '123QWEasd');
