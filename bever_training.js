function setName(executionContext) {
    const Form = executionContext.getFormContext();

    const productLookupValue = Form.getAttribute("cr62c_product").getValue();

    if (productLookupValue != null && productLookupValue.length > 0) {
        const productName = productLookupValue[0].name;

        Form.getAttribute("cr62c_slot_name").setValue(productName);
    } else {
        Form.getAttribute("cr62c_slot_name").setValue(null);
    }
}

function calculateTotalAmount(executionContext) {
    const Form = executionContext.getFormContext();

    const quantity = Form.getAttribute("cr62c_dec_quantity").getValue();
    const pricePerUnit = Form.getAttribute("cr62c_mon_price_per_unit").getValue();

    if (quantity != null && pricePerUnit != null) {
        const totalAmount = quantity * pricePerUnit;

        Form.getAttribute("cr62c_mon_total_amount").setValue(totalAmount);
    } else {
        Form.getAttribute("cr62c_mon_total_amount").setValue(null);
    }
}

function toggleFieldsBasedOnFormType(executionContext) {
    const Form = executionContext.getFormContext();

    const formType = Form.ui.getFormType();

    if (formType === 1) {
        enableAllFields(Form);
    } else if (formType === 2) {
        disableAllFields(Form);
    }
}

function disableAllFields(executionContext) {
    executionContext.ui.controls.forEach(function (control) {
        if (control.getControlType() !== 'subgrid') {
            control.setDisabled(true);
        }
    });
}

function enableAllFields(executionContext) {
    executionContext.ui.controls.forEach(function (control) {
        if (control.getControlType() !== 'subgrid') {
            control.setDisabled(false);
        }
    });
}


function testFunction(executionContext) {
    const Form = executionContext.getFormContext();

    const lookupValue = Form.getAttribute("cr62c_product").getValue();

    if (lookupValue != null && lookupValue.length > 0) {
        const name = lookupValue[0].name;
        const id = lookupValue[0].id;
        const entityType = lookupValue[0].entityType;

        alert("Name: " + name);
        alert("ID: " + id);
        alert("Entity Type: " + entityType);
    } else {
        alert("No product selected.");
    }
}
