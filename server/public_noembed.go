// +build noembed

package main

import "net/http"

var httpPublicFiles = http.Dir("public")
