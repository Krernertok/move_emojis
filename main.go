package main

import (
    "encoding/json"
    "errors"
    "io/ioutil"
    "log"
    "net/http"
    "net/url"
    "os"
    "sync"
    "strconv"
)

type Position struct {
    X float32           `json:"left"`
    Y float32           `json:"top"`
}

type PositionArray struct {
    Positions []Position
    sync.Mutex
} 

var positions PositionArray

func main() {
    PORT := ":8080"
    log.Print("Running server on " + PORT)

    InitPositions(&positions.Positions)
       
    http.Handle("/", http.FileServer(http.Dir("static")))
    http.HandleFunc("/get-positions", HandleGetPositions)
    http.HandleFunc("/update-positions", HandleUpdatePositions)

    log.Fatal(http.ListenAndServe(PORT, nil))
}


func InitPositions(p *[]Position) {
    file, fileErr := ioutil.ReadFile("./config/positions.json")
    if fileErr != nil {
        log.Print("File error: ", fileErr)
        os.Exit(1)
    }

    jsonErr := json.Unmarshal(file, p)
    if jsonErr != nil {
        log.Print("Error while decoding JSON:", jsonErr)
        os.Exit(1)
    }
}


func HandleGetPositions(w http.ResponseWriter, r *http.Request) {
    responseBody := GetPositionsAsJSON()
    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    w.Write(responseBody)
}


func HandleUpdatePositions(w http.ResponseWriter, r *http.Request) {
    newPosition, index, err := GetPositionFromParams(r.URL.Query())
    if err != nil {
        log.Print(err)
    } else {
        UpdatePositions(newPosition, index)
    }

    responseBody := GetPositionsAsJSON()
    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    w.Write(responseBody)
}

func GetPositionFromParams(v url.Values) (p Position, i int, err error) {
    var position Position
    var index int
    index, indexOk := strconv.Atoi(v.Get("index"))
    x, xOk := strconv.ParseFloat(v.Get("left"), 32)
    y, yOk := strconv.ParseFloat(v.Get("top"), 32)

    if indexOk != nil || xOk != nil || yOk != nil {
        return position, index, errors.New("Could not construct position from query parameters.")
    }

    position = Position{
        X: float32(x),
        Y: float32(y),
    }
    return position, index, nil
}


func GetPositionsAsJSON() []byte {
    var positionsJSON []byte
    positionsJSON, err := json.Marshal(positions.Positions)
    if err != nil {
        log.Print("Error encoding JSON: ", err)
    }
    return positionsJSON
}


func UpdatePositions(p Position, i int) {
    positions.Lock()
    defer positions.Unlock()

    if i >= 0 && i < len(positions.Positions) && &p.X != nil && &p.Y != nil {
        position := &positions.Positions[i]
        position.X = p.X
        position.Y = p.Y
    }
}