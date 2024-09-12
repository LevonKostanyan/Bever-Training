function togglePricePerUnitField(executionContext) {
    const Form = executionContext.getFormContext();

    const typeValue = Form.getAttribute("cr62c_os_type").getValue();

    if (typeValue === 587120001) {
        Form.getControl("cr62c_mon_price_per_unit").setVisible(true);
    } else {
        Form.getControl("cr62c_mon_price_per_unit").setVisible(false);
    }
}
