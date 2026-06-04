const API_URL = "https://script.google.com/macros/s/AKfycbxtpNw4kOonP2Uh6Jg89LsHtHrqQUBqbbdZNO0DUBn67-GTi-MO3ECBHZnVx7e8UwFi/exec";
fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({action:"register", name:"ET", phone:"0900000000"})
})
.then(res => res.text())
.then(text => console.log("Response:", text))
.catch(err => console.error("Error:", err));
