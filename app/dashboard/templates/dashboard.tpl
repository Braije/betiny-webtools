<!doctype html>
<html>
<head>
    <title>BETINY - Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>

<main>

    <div class="box">
        <h1>
            Routes
        </h1>
        <ul data-showif="route">
            <li data-foreach="route"><b>{method}</b> - {path}</li>
        </ul>
    </div>

    <div class="box">
        <h1>API</h1>
        <ol class="code" data-showif="api">
            <li data-foreach="api"><b>{type}</b> - $wt.{name}</li>
        </ol>
    </div>

    <div class="box">
        <h1>Middelware</h1>
        <ul class="code" data-showif="middelware">
            <li data-foreach="middelware"><b>{key}</b>  - {name}</li>
        </ul>
    </div>

    <div class="box">
        <h1>Events</h1>
        <ol class="code" data-showif="events">
            <li data-foreach="events"><b>{type}</b> - {name} ({count})</li>
        </ol>
    </div>

</main>

<style>
    * {
        font-family: Arial, Verdana;
    }
    main {
        display: flex;
    }
</style>


</body>
</html>

