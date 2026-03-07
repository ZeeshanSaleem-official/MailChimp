package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Env         string `yaml:"env"`
	StoragePath string `yaml:"storagepath"`
	HTTPServer  struct {
		Address string `yaml:"address"`
	} `yaml:"http_server"`
}

func MustLoad(configPath string) *Config {
	data, err := os.ReadFile(configPath)
	if err != nil {
		panic("cannot read config file: " + err.Error())
	}
	var cfg Config
	err = yaml.Unmarshal(data, &cfg)
	if err != nil {
		panic("cannot parse config file: " + err.Error())
	}
	return &cfg

}
