const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const sqlite3 = require('sqlite3')
const app = express()

let db = null

app.use(express.json())

const intializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server has started')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
  }
}

intializeDBandServer()

const playersDetailsResponse = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const matchDetailsResponse = dbObject => {
  return {
    macthId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

//GET players API-1
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    SELECT 
      *
    FROM
      player_details;`
  const playersArray = await db.all(getPlayersQuery)
  response.send(
    playersArray.map(eachPlayer => playersDetailsResponse(eachPlayer)),
  )
})

//GET player API-2
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
    SELECT 
      *
    FROM
      player_details
    WHERE 
    player_id = '${playerId}';`
  const player = await db.get(getPlayerQuery)
  response.send(playersDetailsResponse(player))
})

//PUT playername API-3
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updatePlayerNameQuery = `
  UPDATE 
    player_details
  SET
    player_name = '${playerName}'
  WHERE 
    player_id = '${playerId}';`
  await db.run(updatePlayerNameQuery)
  response.send('Player Details Updated')
})

//GET match details-4
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetailsQuery = `
            SELECT 
                match_id AS matchId,
                match,
                year
            FROM 
                match_details
            WHERE 
                match_id = ${matchId}
         ;`;

  const matchDetails = await db.get(getMatchDetailsQuery);
  response.send(matchDetails);
})

//GET playermatches API-5
app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
        SELECT
          match_id AS matchId,
          match,
          year
        FROM
          player_match_score NATURAL JOIN match_details
        WHERE
          player_id = '${playerId}';`
  const playerMatches = await db.all(getPlayerMatchesQuery)
  response.send(playerMatches)
})

//GET list of players of a specific match API-6
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchePlayerQuery = `
        SELECT 
            player_match_score.player_id AS playerId,
            player_name AS playerName

        FROM 
            player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id 
        WHERE 
            match_id = ${matchId}
        ;`
  const playerMatches = await db.all(getMatchePlayerQuery)
  response.send(playerMatches)
})

//GET statistics of player API-7
app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const playerScoresQuery = `
        SELECT
          player_details.player_id AS playerId,
          player_details.player_name AS playerName,
          SUM(player_match_score.score) AS totalScore,
          SUM(fours) AS totalFours,
          SUM(sixes) AS totalSixes
        FROM
          player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
        WHERE
          player_details.player_id = ${playerId};`
  const statistics = await db.get(playerScoresQuery)
  response.send(statistics)
})

module.exports = app
