CREATE TABLE Users (
  id INT PRIMARY KEY,
  username varchar(50) NOT NULL,
  password varchar(100) NOT NULL,
);

CREATE TABLE Products (
  code varchar(4) PRIMARY KEY,
  name varchar(50) NOT NULL,
  price INT NOT NULL
);

CREATE TABLE AssetsBreakDown (
  code varchar(4) NOT NULL REFERENCES Products,
  allocation_date varchar(50) NOT NULL,
  allocation_amount INT NOT NULL,
  name ENUM("fixed income", "cash", "equity", "other") NOT NULL
);

CREATE TABLE GeographicalBreakDown (
  code varchar(4) NOT NULL REFERENCES Products,
  allocation_date varchar(50) NOT NULL,
  allocation_amount INT NOT NULL,
  name ENUM("france", "iraq", "canada", "india", "russia") NOT NULL
);
