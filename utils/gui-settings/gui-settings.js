import { ThemeColors } from "./theme-colors";
import { SettingsSearch } from "./settings-search";
import { Validator } from "./text-validate";
function getCategoryItems(category)
{
    let element = category.nextElementSibling;
    const elements = [];
    while (element !== null && !element.classList.contains("category"))
    {
        elements.push(element);
        element = element.nextElementSibling;
    }
    return elements;
}
function settingsChange(key, value)
{
    const checkbox = document.querySelector(`input[type='checkbox'][key='${key}']`);
    if (checkbox)
    {
        checkbox.checked = value;
        return;
    }
    const textbox = document.querySelector(`input[type='text'][key='${key}']`);
    if (textbox)
    {
        textbox.value = value;
        return;
    }
}
function syncGui()
{
    for (const [key, value] of Object.entries(settings))
    {
        settingsChange(key, value);
    }
}
function setupEvents()
{
    document.querySelector(".gui-settings-mask").addEventListener("click", () =>
    {
        document.querySelectorAll(".gui-settings-widgets-box,.gui-settings-box,.gui-settings-mask")
            .forEach(it => it.classList.remove("opened"));
    });
    document.querySelectorAll("input[type='text'][key]").forEach(element =>
    {
        element.setAttribute("placeholder", settings[element.getAttribute("key")]);
    });
    document.querySelectorAll(".gui-settings-content ul li.category").forEach(it =>
    {
        it.addEventListener("click", e =>
        {
            const searchBox = document.querySelector(".gui-settings-search");
            if (searchBox.value !== "")
            {
                searchBox.value = "";
                raiseEvent(searchBox, "input");
            }
            e.currentTarget.classList.toggle("folded");
            getCategoryItems(e.currentTarget).forEach(it => it.classList.toggle("folded"));
        });
    });
    document.querySelectorAll(".gui-settings-dropdown>input").forEach(it =>
    {
        it.addEventListener("click", e =>
        {
            e.currentTarget.parentElement.classList.toggle("opened");
        });
    });
    onSettingsChange((key, _, value) =>
    {
        if (settings[key] !== value)
        {
            settings[key] = value;
            const checkbox = document.querySelector(`input[type='checkbox'][key='${key}']`);
            if (checkbox)
            {
                checkbox.checked = value;
                raiseEvent(checkbox, "change");
                return;
            }
            const textbox = document.querySelector(`input[type='text'][key='${key}']`);
            if (textbox)
            {
                textbox.value = value;
                raiseEvent(textbox, "change");
                return;
            }
        }
    });
}
function listenSettingsChange()
{
    const reloadChanges = (key) =>
    {
        // const reloadableKey = Resource.reloadables[key];
        // if (reloadableKey)
        // {
        //     resources.fetchByKey(reloadableKey);
        // }
    };
    document.querySelectorAll("input[type='checkbox'][key]").forEach(element =>
    {
        element.addEventListener("change", () =>
        {
            const key = element.getAttribute("key");
            const value = element.checked;
            settings[key] = value;
            reloadChanges(key);
            saveSettings(settings);
        });
    });
    document.querySelectorAll("input[type='text'][key]").forEach(element =>
    {
        element.addEventListener("change", () =>
        {
            const key = element.getAttribute("key");
            const value = Validator.getValidator(key).validate(element.value);
            settings[key] = value;
            element.value = value;
            reloadChanges(key);
            saveSettings(settings);
        });
    });
}
function listenDependencies()
{
    const dependencies = {};
    document.querySelectorAll(`input[dependencies]`).forEach(element =>
    {
        const dep = element.getAttribute("dependencies");
        if (dep)
        {
            dependencies[element.getAttribute("key")] = dep;
        }
    });
    const checkBoxChange = element =>
    {
        const checked = element.checked;
        for (const key in dependencies)
        {
            const dependency = dependencies[key].split(" ");
            if (dependency.indexOf(element.getAttribute("key")) !== -1)
            {
                let disable = true;
                if (checked && dependency.every(k => document.querySelector(`input[key='${k}']`).checked))
                {
                    disable = false;
                }
                let li = document.querySelector(`input[key='${key}']`);
                while (li.nodeName.toLowerCase() !== "li")
                {
                    li = li.parentElement;
                }
                const action = disable ? "add" : "remove";
                li.classList[action]("disabled");
                const text = document.querySelector(`input[key='${key}'][type='text']`);
                text && text.parentElement.classList[action]("disabled");
            }
        }
    };
    document.querySelectorAll(`input[type='checkbox'][key]`).forEach(element =>
    {
        element.addEventListener("change", e => checkBoxChange(e.target));
        checkBoxChange(element);
    });
}
function checkOfflineData()
{
    if (typeof offlineData !== "undefined")
    {
        document.querySelector(".gui-settings-checkbox-container>input[key=useCache]").parentElement.parentElement.classList.add("disabled");
        document.querySelector("input[key=useCache]").disabled = true;
    }
}
function foldAllCategories()
{
    document.querySelectorAll(".gui-settings-content ul li.category").forEach(e =>
    {
        e.click();
    });
}
function checkCompatibility()
{
    if (!CSS.supports("backdrop-filter", "blur(24px)")
        && !CSS.supports("-webkit-backdrop-filter", "blur(24px)"))
    {
        document.querySelector("input[key=blurVideoControl]").disabled = true;
        settings.blurVideoControl = false;
        saveSettings(settings);
    }
    if (window.devicePixelRatio === 1)
    {
        document.querySelector("input[key=harunaScale]").disabled = true;
        settings.harunaScale = false;
        saveSettings(settings);
    }
    if (settings.defaultPlayerLayout === "旧版")
    {
        const navbarOption = document.querySelector("input[key=overrideNavBar]");
        navbarOption.disabled = true;
        raiseEvent(navbarOption, "change");
        if (settings.overrideNavBar)
        {
            navbarOption.checked = false;
            raiseEvent(navbarOption, "change");
            settings.overrideNavBar = false;
            saveSettings(settings);
        }
    }
}
function setDisplayNames()
{
    for (const [key, name] of Object.entries(Resource.displayNames))
    {
        const input = document.querySelector(`input[key=${key}]`);
        if (!input)
        {
            continue;
        }
        switch (input.type)
        {
            case "checkbox":
                input.nextElementSibling.nextElementSibling.innerHTML = name;
                break;
            case "text":
                const parent = input.parentElement;
                if (parent.classList.contains("gui-settings-textbox-container"))
                {
                    input.previousElementSibling.innerHTML = name;
                }
                else if (parent.classList.contains("gui-settings-dropdown"))
                {
                    parent.previousElementSibling.innerHTML = name;
                }
                break;
            default:
                break;
        }
    }
}

(async () =>
{
    resources.applyStyle("guiSettingsStyle");
    const settingsBox = (resources.data.guiSettingsDom || resources.data.guiSettingsHtml).text;
    document.body.insertAdjacentHTML("beforeend", settingsBox);
    document.body.insertAdjacentHTML("afterbegin", `<link rel="stylesheet" href="//cdn.materialdesignicons.com/3.5.95/css/materialdesignicons.min.css">`);
    new SpinQuery(
        () => document.body,
        it => it && !(unsafeWindow.parent.window === unsafeWindow),
        _ => document.querySelector(".gui-settings-icon-panel").style.display = "none",
    ).start();

    setupEvents();
    checkOfflineData();
    syncGui();
    listenDependencies();
    listenSettingsChange();
    foldAllCategories();
    checkCompatibility();
    setDisplayNames();
    new ThemeColors().setupDom();
    new SettingsSearch();
})();