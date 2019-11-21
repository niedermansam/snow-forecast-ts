import { CreateElement } from "./helpers"

export const helpModal = () => {
    let overlay = new CreateElement({tag: 'div', parentElement: document.body, options: {className: "modal-overlay"}})
    let modal = overlay.createChild({tag: 'div', options: {className: 'modal help-modal'}})
    overlay.self.addEventListener('click', e => {
        let elem = e.target as HTMLElement;
        if (elem.classList.contains('modal-overlay')) overlay.self.remove()
    })


    let close = modal.createChild({ tag: 'span', options: { text: "×", className: "close-modal" } });
    close.self.addEventListener('click', e => {
        overlay.self.remove()
    })

    modal.createChild({ tag: 'h1', options: { text: "Welcome to Snow Finder", style: "margin-top: -1em" } })

    modal.createAlert("Backcountry travel is inherently dangerous. Ski and ride safe!", "danger")

    modal.createChild({ tag: 'p', options: { text: "Our goal is to make tracking snow storms and pow days as easy as possible." } })

    modal.createChild({ tag: 'p', options: { text: "The snow finder saves the map view and forecast locations in the URL so you can easily save forecasts for your favorite pow stash, or share your current view with your friends." } })

    modal.createChild({ tag: 'h2', options: { text: "Getting Forecasts" } })

    modal.createAlert('We currently only support forecasts in the United States.', 'warning')

    modal.createChild({ tag: 'p', options: { text: "Click on the map and a popup will appear with forecast information from the National Weather Service." } })

    modal.createChild({ tag: 'p', options: { text: `Click the <button class="forecast-details-button" type="button">Details</button> button on the forecast popup to view a more detailed forecast.` } })

    modal.createChild({ tag: 'p', options: { text: `Click the <button class="remove-forecast-button" type="button">Remove</button> button on the forecast popup to remove the forecast from the map.` } })

    //modal.createChild({ tag: 'p', options: { text: "The location of the forecast will be saved in the URL so you can bookmark or share forecast views." } })

}