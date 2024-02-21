const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join('.././coding-practice-6a', 'covid19India.db')

let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => console.log('Server is Running at localhost:300/'))
  } catch (error) {
    console.log(`DB Error ${error.message}`)
  }
}

initializeDBAndServer()

const snake_caseToCamelCase = function (dbObject) {
  try {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    }
  } catch (err) {
    console.log('Resource Not Found')
  }
}

// API 1 to GET List of all States in the state table
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;
  `
  const statesArray = await db.all(getStatesQuery)
  console.log(statesArray)
  const resultInDesiredFormatte = statesArray.map((eachState, index, arr) =>
    snake_caseToCamelCase(eachState),
  )
  response.send(resultInDesiredFormatte)
})

// API 2 to get a single state through stateId in the state table
app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getSingleStateQuery = `
    SELECT * FROM state WHERE state_id = ${stateId}; 
  `
  const stateArray = [await db.get(getSingleStateQuery)]
  console.log(stateArray)
  const desiredResult = stateArray.map(eachState =>
    snake_caseToCamelCase(eachState),
  )

  for (let s of desiredResult) {
    response.send(s)
  }
})

// API 3to add a District in the district table
app.post('/districts/', async (request, response) => {
  const postDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = postDetails

  const postQuery = `
    INSERT INTO district(
      district_name, state_id, cases, cured, active, deaths
    ) 
    VALUES(
      '${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths}
    );
  `
  const dbResponse = await db.run(postQuery)
  response.send('District Successfully Added')
})

// API 4 to Get district based on district_id in the district table
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id = ${districtId};
  `
  const districtArray = [await db.get(getDistrictQuery)]
  console.log(districtArray)
  const desiredResult = districtArray.map((eachDistrict, index, arr) => {
    return {
      districtId: eachDistrict.district_id,
      districtName: eachDistrict.district_name,
      stateId: eachDistrict.state_id,
      cases: eachDistrict.cases,
      cured: eachDistrict.cured,
      active: eachDistrict.active,
      deaths: eachDistrict.deaths,
    }
  })
  console.log(desiredResult)
  for (let s of desiredResult) {
    response.send(s)
  }
})

// API 5 to delete district from district table based on district_id
app.delete('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
    DELETE FROM district WHERE district_id = ${districtId};
  `
  await db.run(deleteQuery)
  response.send('District Removed')
})

//API 6 Updating Details of a District based on distric Id
app.put('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const updateDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = updateDetails
  const updateDetailsQuery = `
    UPDATE district
    SET 
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    
      WHERE district_id = ${districtId};
  `
  await db.run(updateDetailsQuery)
  response.send('District Details Updated')
})

// APi 7 to GET details from state table
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getDetailsQuery = `
    SELECT 
      SUM(cases) AS totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
     FROM district WHERE state_id = ${stateId};
  `
  const stateDetails = await db.get(getDetailsQuery)
  console.log(stateDetails)
  response.send(stateDetails)
})

// Get API 8
app.get('/districts/:districtId/details/'),
  async (request, response) => {
    const {districtId} = request.params
    const getDetails = `
      SELECT state_id FROM district WHERE district_id = ${districtId};
    `
    const desired_state_id = await db.get(getDetails)
    console.log(desired_state_id)
    const state_nameQuery = `
      SELECT state_name FROM state WHERE 
      state_id = ${desired_state_id.state_id};
    `
    const dbResponse = await db.get(state_nameQuery)
    response.send({
      stateName: dbResponse['state_id'],
    })
  }

module.exports = app
