Subject: 401 “Login or API Key Required” when calling Delhivery waybill/serviceability APIs

Hello Delhivery Support,

We are receiving 401 responses when calling Delhivery APIs from our application. Request details and reproducible commands are below — please advise whether the token is valid for these endpoints, whether we must use a different environment (staging/production), or if IP allowlisting / other configuration is required.

Account / context:
- Integration owner: Nexprism / Bharatgram B2C
- Environment: developer/test host
- Token (full): 91be46abf4dde7d868b4af4db9129c4581c2e1f9
- Time tested (UTC): Wed, 11 Feb 2026 07:57:15 GMT

Repro steps (curl commands we ran):

1) Waybill API — token as query param
```
curl -i "https://track.delhivery.com/waybill/api/bulk/json/?token=91be46abf4dde7d868b4af4db9129c4581c2e1f9&cl=BHARATGRAM%20B2C&count=1"
```

2) Waybill API — Authorization header fallback
```
curl -i -H "Authorization: Token 91be46abf4dde7d868b4af4db9129c4581c2e1f9" "https://track.delhivery.com/waybill/api/bulk/json/?cl=BHARATGRAM%20B2C&count=1"
```

3) PIN serviceability (pin 110001)
```
curl -i "https://track.delhivery.com/c/api/pin-codes/json/?token=91be46abf4dde7d868b4af4db9129c4581c2e1f9&filter_codes=110001"
```

Raw responses (exact bodies returned):

- Query-param waybill: HTTP/1.1 401 Unauthorized
  Body: Login or API Key Required

- Header-auth waybill: HTTP/1.1 401 OK
  Body: Login or API Key Required

- Serviceability (pin): HTTP/1.1 401 OK
  Body: Login or API Key Required

- We tried both query-param and Authorization header formats; both returned 401 with the same message.
- Please confirm:
  - Is this token active/valid for the above endpoints?
  - Is there a separate endpoint or token for testing vs production?
  - Are there any IP allowlist or referrer restrictions we must configure?

Below are the full raw request/response headers and bodies captured when testing from our developer environment.

--- FULL REQUEST / RESPONSE (sensitive) ---

1) Query-param waybill request:
GET /waybill/api/bulk/json/?token=91be46abf4dde7d868b4af4db9129c4581c2e1f9&cl=BHARATGRAM%20B2C&count=1 HTTP/1.1
Host: track.delhivery.com
User-Agent: curl/7.79.1
Accept: */*

Response:
HTTP/1.1 401 Unauthorized
Date: Wed, 11 Feb 2026 07:57:15 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 25
Connection: keep-alive
Server: nginx/1.18.0 (Ubuntu)
Vary: Authorization, Cookie
Expires: Wed, 11 Feb 2026 07:57:15 GMT
Cache-Control: max-age=0, no-cache, no-store, must-revalidate
X-Frame-Options: SAMEORIGIN

Body:
Login or API Key Required

2) Header-auth waybill request:
GET /waybill/api/bulk/json/?cl=BHARATGRAM%20B2C&count=1 HTTP/1.1
Host: track.delhivery.com
User-Agent: curl/7.79.1
Accept: */*
Authorization: Token 91be46abf4dde7d868b4af4db9129c4581c2e1f9

Response:
HTTP/1.1 401 OK
Date: Wed, 11 Feb 2026 07:57:15 GMT
Content-Type: text/html; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Server: nginx
Expires: Wed, 11 Feb 2026 07:57:15 GMT
Vary: Authorization, Cookie
Last-Modified: Wed, 11 Feb 2026 07:57:15 GMT
Cache-Control: max-age=0
X-Frame-Options: SAMEORIGIN

Body:
Login or API Key Required

3) Serviceability (PIN) request:
GET /c/api/pin-codes/json/?token=91be46abf4dde7d868b4af4db9129c4581c2e1f9&filter_codes=110001 HTTP/1.1
Host: track.delhivery.com
User-Agent: curl/7.79.1
Accept: */*

Response:
HTTP/1.1 401 OK
Date: Wed, 11 Feb 2026 07:57:15 GMT
Content-Type: text/html; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Server: nginx
Expires: Wed, 11 Feb 2026 07:57:15 GMT
Vary: Authorization, Cookie
Last-Modified: Wed, 11 Feb 2026 07:57:15 GMT
Cache-Control: max-age=0
X-Frame-Options: SAMEORIGIN

Body:
Login or API Key Required

--- end sensitive section ---

If you prefer that we send the token and headers via a secure channel, tell us the preferred secure upload method or ticket number and we'll provide them there.

Thanks,
Nexprism Engineering

--
Command results (captured):

HTTP/1.1 401 Unauthorized
Date: Wed, 11 Feb 2026 07:57:15 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 25
Connection: keep-alive
Server: nginx/1.18.0 (Ubuntu)
Body: Login or API Key Required

HTTP/1.1 401 OK
Date: Wed, 11 Feb 2026 07:57:15 GMT
Content-Type: text/html; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Server: nginx
Body: Login or API Key Required

HTTP/1.1 401 OK
Date: Wed, 11 Feb 2026 07:57:15 GMT
Content-Type: text/html; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Server: nginx
Body: Login or API Key Required
