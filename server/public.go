// +build !noembed

package main

import (
	"embed"
	"io/fs"
	"net/http"
	"path"
)

//go:embed public/*
var publicFiles embed.FS

var httpPublicFiles = &prefixedOnlyFilesFS{http.FS(publicFiles), "public"}

type prefixedOnlyFilesFS struct {
	inner  http.FileSystem
	prefix string
}

func (p *prefixedOnlyFilesFS) Open(name string) (f http.File, err error) {
	f, err = p.inner.Open(path.Join(p.prefix, name))
	if err != nil {
		return
	}
	return &hijackReaddirFile{f}, nil
}

type hijackReaddirFile struct {
	http.File
}

func (f *hijackReaddirFile) Readdir(count int) ([]fs.FileInfo, error) {
	return nil, nil
}
