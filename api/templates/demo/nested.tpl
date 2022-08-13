
<span data-foreach="{unexisting}">{unexisting.toto}</span>

<div data-foreach="{menu}" class="section">
    <label for="others">
        {menu.group}
    </label>
    <p data-foreach="{menu.dir}" class="demo">
        <a href="{menu.dir.href}">
            {menu.dir.name}
        </a>
    </p>
</div>

{uec}