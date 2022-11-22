const { Router } = require("express");
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require("axios");
const { Character, Occupation, character_occuption } = require("../db.js");
const router = Router();
///
//http://localhost:3001/characters
//

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
const getApiInfo = async () => {
  const apiurl = await axios.get("https://breakingbadapi.com/api/characters");
  const apiInfo = await apiurl.data.map((el) => {
    return {
      id: el.char_id,
      name: el.name,
      image: el.img,
      nickName: el.nickname,
      status: el.status,
      occupation: el.occupation.map((el) => el),
      birthday: el.birthday,
      appearance: el.appearance.map((el) => el),
    };
  });
  return apiInfo;
};
const getDbInfo = async () => {
  return await Character.findAll({
    include: {
      model: Occupation,
      attributes: ["name"],
      through: {
        attributes: [],
      },
    },
  });
};

const getAllCharacters = async () => {
  const apiInfo = await getApiInfo();
  const dbInfo = await getDbInfo();
  const infoTotal = apiInfo.concat(dbInfo);
  return infoTotal;
};

router.get("/characters", async (req, res) => {
  const name = req.query.name;
  const charactersTotal = await getAllCharacters();
  if (name) {
    let characterName = await charactersTotal.filter((el) =>
      el.name.toLowerCase().includes(name.toLocaleLowerCase())
    );
    characterName.length
      ? res.status(200).send(characterName)
      : res.status(404).send("No hay personaje con ese nombre");
  } else {
    res.status(200).send(charactersTotal);
  }
});
router.get("/occupations", async (req, res) => {
  const occupationsApi = await axios.get(
    "https://breakingbadapi.com/api/characters"
  );
  // este ejercicios, entro a la api. Despues mapeou la informacion
  //LO  QUE HAGO ACA ES ( ME TRAIGO LA INFORMACION DE LA api PARA GUIARDARLA EN MI BASE DE datos e sacarla desde la base de datos  )
  const occupations = occupationsApi.data.map((el) => el.occupation);
  const occucEach = occupations.map((el) => {
    for (let i = 0; i < el.length; i++) return el[i];
  });
  console.log(occucEach); // COM ESE CONSOLE.LOG (  ME TRAJE  LAS OCUPACIONES UNA POR UNA-- DESARMA LOS ARREGLOS E ME DEVOLVE TODAS LAS INFORMACIONES DE LA api ***  SE TIENE (force-- seteado em FALSE-- eso solo hace una sola vez. Pero si tene seteado en TRUE lo va hacer cada vez que levantemos el BACK )
  occucEach.forEach((el) => {
    Occupation.findOrCreate({
      where: { name: el },
    });
  });
  const allOccupations = await Occupation.findAll();
  res.send(allOccupations);
});

router.post("/character", async (req, res) => {
  const { name, nickName, birthday, image, status, createdInDb, occupation } =
    req.body;

  const characterCreated = await Character.create({
    name,
    nickName,
    birthday,
    image,
    status,
    createdInDb,
  });
  // ACA NO PASSO LA OCUPACION PQ ?  És necessario hacer la relacion de la ocupacion a parte

  const occupationDb = await Occupation.findAll({
    where: {
      name: occupation,
    },
    // aca tengo que encontrar em mis MODELO DE ocupaciones todos las que coincidan con los  nombres que lleham por BODY- tengo que encontrar en um modelo que ja tengo, que ya existe
  });
  characterCreated.addOccupation(occupationDb);
  res.send(200).send("Personaje creado con exito");
});

router.get("/character/:id", async (req, res) => {
  const id = req.params.id;
  const charactersTotal = await getAllCharacters();
  if (id) {
    const characterId = await charactersTotal.filter((el) => el.id == id);
    characterId.length
      ? res.status(200).json(characterId)
      : res.status(404).send("No encontre ese personaje");
  }
});

//npm i axios
module.exports = router;
// {"name": "vanesa",
// "image": "https://th.bing.com/th/id/R.ddba56f48a28626e30ac5210f7b8c782?rik=XzTgIAyadTenKw&pid=ImgRaw&r=0",
// "nickName": "torres",
//   "status": "Deceased",
//     "birthday": "07-08-1981",
// "occupation": [
// "Juarez Cartel Lieutenant"
// ]
//}
