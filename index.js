const express = require("express");
const app = express();
const ora = require("oracledb");
const dotenv = require("dotenv");
const morgan = require("morgan");

dotenv.config();

ora.initOracleClient();

app.set("view-engine", "ejs");
app.use(morgan("tiny"));
app.use(express.static(__dirname + "/public"));

const withConnection = async (cb) => {
  let conn;

  try {
    conn = await ora.getConnection({
      user: process.env.NODE_ORACLEDB_USER,
      password: process.env.NODE_ORACLEDB_PASSWORD,
      connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING,
    });

    await cb(conn);
  } catch (e) {
    throw {
      status: 500,
      message: e.message || "Algo deu errado",
      stack: e.stack || {},
      datetime: new Date(),
    };
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.log(e);
      }
    }
  }
};

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/visualization", (req, res) => {
  let data = JSON.parse(req.query.data);

  let msg = (field) => `[${field}]`;

  let company = {
    name: process.env.COMPANY_NAME || msg("COMPANY_NAME"),
    taxId: process.env.COMPANY_TAX_ID || msg("COMPANY_TAX_ID"),
    address: process.env.COMPANY_ADDRESS || msg("COMPANY_ADDRESS"),
    addressNumber:
      process.env.COMPANY_ADDRESS_NUMBER || msg("COMPANY_ADDRESS_NUMBER"),
    district: process.env.COMPANY_DISTRICT || msg("COMPANY_DISTRICT"),
    phone: process.env.COMPANY_PHONE || msg("COMPANY_PHONE"),
    postalCode: process.env.COMPANY_POSTAL_CODE || msg("COMPANY_POSTAL_CODE"),
    stateTax: process.env.COMPANY_STATE_TAX || msg("COMPANY_STATE_TAX"),
    city: process.env.COMPANY_CITY || msg("COMPANY_CITY"),
    watermarkUrl:
      process.env.COMPANY_WATERMARK_URL || msg(COMPANY_WATERMARK_URL),
  };

  res.render("visualization.ejs", { data: data, company: company });
});

app.use("/costumers/:code", async (req, res, next) => {
  try {
    await withConnection(async (conn) => {
      let code = req.params.code;

      let rset = await conn.execute(
        `select cliente, cgcent, endercob, numerocob, municcob, bairrocob from pcclient where codcli = :code`,
        [code]
      );

      if (rset.rows.length <= 0) {
        throw {
          status: 400,
          message: `Cliente código ${code} não foi encontrado`,
          datetime: new Date(),
        };
      }

      let jsonRes = {};

      rset.metaData.map((v, i) => {
        jsonRes[v.name.toLowerCase()] = rset.rows[0][i];
      });

      res.status(200).json(jsonRes);
    });
  } catch (e) {
    next(e);
  }
});

app.use("/products/:code", async (req, res, next) => {
  try {
    await withConnection(async (conn) => {
      let code = req.params.code;

      let rset = await conn.execute(
        `select descricao from pcprodut where codprod = :code`,
        [code]
      );

      if (rset.rows.length <= 0) {
        throw {
          status: 400,
          message: `Produto código ${code} não foi encontrado`,
          datetime: new Date(),
        };
      }

      res.status(200).json({ descricao: rset.rows[0][0] });
    });
  } catch (e) {
    next(e);
  }
});

app.use((err, req, res, next) =>
  res.status(err.status || 500).json({
    message: err.message || "Algo deu errado",
    stack: err.stack || {},
    datetime: err.date || new Date(),
  })
);

const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";

app.listen(port, host, console.log(`server running on http://${host}:${port}`));
