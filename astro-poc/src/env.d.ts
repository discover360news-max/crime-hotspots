/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

declare namespace App {
  interface Locals {
    runtime: import('@astrojs/cloudflare').Runtime<Env>;
  }
}
