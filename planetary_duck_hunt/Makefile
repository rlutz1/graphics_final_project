# compiler
EMCC = emcc 

# -lm links math library
# -Wall turns on compiler warnings
# -O2 enables compiler optimization, 
# -sMODULARIZE=1 wraps the generated javascript in a function that can generate the module
# -sEXPORTED_RUNTIME_METHODS=HEAPU8 gives us access to shared heap memory
# -sEXPORT_NAME names the function that will load the module
CFLAGS = -lm -Wall -O2 -sMODULARIZE=1 -sEXPORTED_RUNTIME_METHODS=HEAPU8 -sEXPORT_NAME=createWASMModule 

TARGET = Cbuild/boidRunner.js

all: $(TARGET)

$(TARGET): Csrc/boids.c Csrc/vector.c
	$(EMCC) Csrc/boids.c Csrc/vector.c $(CFLAGS) -o $(TARGET)

serve: all 
	python3 -m http.server 8000 

clean:
	rm -r Cbuild/boidRunner.js Cbuild/boidRunner.wasm 