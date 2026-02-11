#!/usr/bin/env bash
deno run -A main_declarative.ts --log_show pkg --name Bob --happy-mode 
deno run -A main_declarative.ts --name Bob --happy-mode goodbye
deno run -A main_declarative.ts --name Bob --happy-mode goodbye --time
deno run -A main_declarative.ts --name Bob --happy-mode goodbye --time 1
deno run -A main_declarative.ts --name Bob --happy-mode goodbye file1
deno run -A main_declarative.ts --name Bob --happy-mode goodbye file1 -h
deno run -A main_declarative.ts --name Bob --happy-mode hello 
deno run -A main_declarative.ts --name Bob --happy-mode hello --time 5
deno run -A main_declarative.ts --name Bob --happy-mode hello -h
deno run -A main_declarative.ts -h
deno run -A main_declarative.ts hello -h
