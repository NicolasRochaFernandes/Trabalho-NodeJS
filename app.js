const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: process.env.user,
    password: process.env.password,
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
    createDatabase();
});

function createDatabase() {
    db.query("CREATE DATABASE IF NOT EXISTS concessionaria", (err, result) => {
        if (err) throw err;
        db.query("USE concessionaria", (err, result) => {
            if (err) throw err;
            db.query("CREATE TABLE IF NOT EXISTS dono (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(255))", (err, result) => {
                if (err) throw err;
                db.query("CREATE TABLE IF NOT EXISTS carro (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(255), placa VARCHAR(255), id_dono INT, FOREIGN KEY(id_dono) REFERENCES dono(id))", (err, result) => {
                    if (err) throw err;
                });
            });
        });
    });
}
createDatabase()

app.listen(3000, () => {
    console.log("Server started on port 3000");
});

// Ler todos os registros da entidade A (dono) e B (carro)
app.get('/all', (req, res) => {
    db.query("SELECT dono.nome as nome_dono, dono.id as id_dono, carro.nome as nome_carro,carro.id as id_carro,carro.placa FROM dono JOIN carro on carro.id_dono = dono.id", (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Ler apenas um registro pelo id da entidade A e B
app.get('/dono/:id', (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM dono WHERE id = ?", [id], (err, dono) => {
        if (err) throw err;
        db.query("SELECT * FROM carro WHERE id_dono = ?", [id], (err, carros) => {
            if (err) throw err;
            res.json({ dono: dono[0], carros });
        });
    });
});

app.get('/carro/:id', (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM carro WHERE id = ?", [id], (err, carro) => {
        if (err) throw err;
        db.query("SELECT * FROM dono WHERE id = ?", [carro[0].id_dono], (err, dono) => {
            if (err) throw err;
            res.json({ carro: carro[0], dono: dono[0] });
        });
    });
});

// Ler subconjunto de registros, buscando por um atributo da entidade A e B
app.get('/donos/nome/:nome', (req, res) => {
    const { nome } = req.params;
    db.query("SELECT * FROM dono WHERE nome LIKE ?", [`%${nome}%`], (err, donos) => {
        if (err) throw err;
        const donoIds = donos.map(dono => dono.id);
        if (donoIds.length > 0) {
            db.query("SELECT * FROM carro WHERE id_dono IN (?)", [donoIds], (err, carros) => {
                if (err) throw err;
                res.json({ donos, carros });
            });
        } else {
            res.json({ donos: [], carros: [] });
        }
    });
});

app.get('/carros/nome/:nome', (req, res) => {
    const { nome } = req.params;
    db.query("SELECT * FROM carro WHERE nome LIKE ?", [`%${nome}%`], (err, carros) => {
        if (err) throw err;
        const donoIds = carros.map(carro => carro.id_dono);
        if (donoIds.length > 0) {
            db.query("SELECT * FROM dono WHERE id IN (?)", [donoIds], (err, donos) => {
                if (err) throw err;
                res.json({ carros, donos });
            });
        } else {
            res.json({ carros: [], donos: [] });
        }
    });
});

// Criar um registro da entidade A (dono)
app.post('/dono', (req, res) => {
    const { nome } = req.body;
    db.query("INSERT INTO dono (nome) VALUES (?)", [nome], (err, result) => {
        if (err) throw err;
        res.json({ id: result.insertId, nome });
    });
});

// Criar um registro da entidade B (carro)
app.post('/carro', (req, res) => {
    const { nome, placa, id_dono } = req.body;
    db.query("INSERT INTO carro (nome, placa, id_dono) VALUES (?, ?, ?)", [nome, placa, id_dono], (err, result) => {
        if (err) throw err;
        res.json({ id: result.insertId, nome, placa, id_dono });
    });
});

// Atualizar um registro da entidade A (dono)
app.put('/dono/:id', (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;
    db.query("UPDATE dono SET nome = ? WHERE id = ?", [nome, id], (err, result) => {
        if (err) throw err;
        res.json({ id, nome });
    });
});

// Atualizar um registro da entidade B (carro)
app.put('/carro/:id', (req, res) => {
    const { id } = req.params;
    const { nome, placa, id_dono } = req.body;
    db.query("UPDATE carro SET nome = ?, placa = ?, id_dono = ? WHERE id = ?", [nome, placa, id_dono, id], (err, result) => {
        if (err) throw err;
        res.json({ id, nome, placa, id_dono });
    });
});

// Excluir um registro da entidade A (dono)
app.delete('/dono/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM dono WHERE id = ?", [id], (err, result) => {
        if (err) throw err;
        res.json({ message: "Dono deletado com sucesso" });
    });
});

// Excluir um registro da entidade B (carro)
app.delete('/carro/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM carro WHERE id = ?", [id], (err, result) => {
        if (err) throw err;
        res.json({ message: "Carro deletado com sucesso" });
    });
});