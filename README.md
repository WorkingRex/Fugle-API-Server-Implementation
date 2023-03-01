# Fugle-API-Server-Implementation
群馥科技 Backend Developer (Node.js) Pretest

# Part 3:WebSocket API
## Subscriptions
```
{
    "event": "subscribe",
    "data": {
        "channels": ["btcusd", "btceur"]
    }
}
```
## Unsubscriptions
```
{
    "event": "unsubscribe",
    "data": {
        "channels": ["btcusd"]
    }
}
```