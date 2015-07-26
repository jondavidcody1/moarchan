package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"github.com/jondavidcody1/rtgo"
	"github.com/satori/go.uuid"
	"github.com/vincent-petithory/dataurl"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io/ioutil"
	"log"
	"os"
	"time"
)

var app *rtgo.App

func UploadHandler(conn *rtgo.Conn, data []byte, msg *rtgo.Message) {
	schema := make(map[string]interface{})
	err := json.Unmarshal(msg.Payload, &schema)
	if err != nil {
		log.Println(err)
		return
	}
	topic := schema["topic"].(string)
	now := time.Now()
	schema["timestamp"] = fmt.Sprintf("%d/%d/%d(%s)%d:%d:%d", now.Month(), now.Day(), now.Year(), now.Weekday().String()[:3], now.Hour(), now.Minute(), now.Second())
	schema["uuid"] = uuid.NewV4().String()
	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(fmt.Sprintf("%s%s", schema["timestamp"], schema["uuid"]))))[:9]
	schema["hash"] = hash
	if file, ok := schema["file"].(string); ok {
		file_path := fmt.Sprintf("./static/images/uploads/%s", schema["file_name"])
		fdata, err := dataurl.DecodeString(file)
		if err != nil {
			log.Println(err)
			return
		}
		ioutil.WriteFile(file_path, fdata.Data, 0775)
		saved_file, err := os.Open(file_path)
		if err != nil {
			log.Println(err)
			return
		}
		var config image.Config
		if schema["file_mime"] == "image/jpeg" {
			config, err = jpeg.DecodeConfig(saved_file)
		} else if schema["file_mime"] == "image/png" {
			config, err = png.DecodeConfig(saved_file)
		} else if schema["file_mime"] == "image/gif" {
			config, err = gif.DecodeConfig(saved_file)
		}
		schema["file_dimensions"] = fmt.Sprintf("%dx%d", config.Width, config.Height)
		delete(schema, "file")
	}
	if schema["type"] == "thread" {
		if err := app.DB.InsertObj(topic, hash, schema); err != nil {
			return
		}
	} else if schema["type"] == "reply" {
		thread := schema["thread"].(string)
		if obj, err := app.DB.GetObj(topic, thread); err == nil {
			thisobj := obj.(map[string]interface{})
			replies := thisobj["replies"].(map[string]interface{})
			replies[hash] = schema
			tagging := schema["tagging"].([]interface{})
			for _, tag := range tagging {
				if tag.(string) == thread {
					thisobj["taggedBy"] = append(thisobj["taggedBy"].([]interface{}), hash)
				} else if _, ok := replies[tag.(string)]; ok {
					reply := replies[tag.(string)].(map[string]interface{})
					reply["taggedBy"] = append(reply["taggedBy"].([]interface{}), hash)
				}
			}
			if err := app.DB.InsertObj(topic, thread, thisobj); err != nil {
				log.Println(err)
				return
			}
		} else {
			log.Println(err)
			return
		}
	}
	payload, err := json.Marshal(&schema)
	if err != nil {
		log.Println(err)
		return
	}
	response := &rtgo.Message{
		RoomLength:    len(schema["topic"].(string)),
		Room:          schema["topic"].(string),
		EventLength:   len("new-" + schema["type"].(string)),
		Event:         "new-" + schema["type"].(string),
		DstLength:     0,
		Dst:           "",
		SrcLength:     len(conn.Id),
		Src:           conn.Id,
		PayloadLength: len(payload),
		Payload:       payload,
	}
	binary_response := rtgo.MessageToBytes(response)
	conn.Emit(binary_response, response)
	conn.Send <- binary_response
}

func main() {
	app = rtgo.NewApp()
	app.Parse("./config.json")
	app.Emitter.On("new-thread", UploadHandler)
	app.Emitter.On("new-reply", UploadHandler)
	app.Start()
}
