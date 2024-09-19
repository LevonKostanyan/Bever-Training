function togglePricePerUnitField(executionContext) {
    let formContext = executionContext.getFormContext();

    let typeValue = formContext.getAttribute("cr62c_os_type").getValue();

    if (typeValue === 587120001) {
        formContext.getControl("cr62c_mon_price_per_unit").setVisible(true);
    } else {
        formContext.getControl("cr62c_mon_price_per_unit").setVisible(false);
    }
}
