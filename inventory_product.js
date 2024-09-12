function setName(executionContext) {
    let Form = executionContext.getFormContext();

    let productLookupValue = Form.getAttribute("cr62c_product").getValue();

    if (productLookupValue != null && productLookupValue.length > 0) {
        let productName = productLookupValue[0].name;

        Form.getAttribute("cr62c_name").setValue(productName);
    } else {
        Form.getAttribute("cr62c_name").setValue(null);
    }
}

function calculateTotalAmount(executionContext) {
    const Form = executionContext.getFormContext();

    const quantityField = Form.getAttribute("cr62c_dec_quantity");
    const pricePerUnitField = Form.getAttribute("cr62c_mon_price_per_unit");

    if (quantityField != null && pricePerUnitField != null) {
        const quantity = quantityField.getValue();
        const pricePerUnit = pricePerUnitField.getValue();

        if (quantity != null && pricePerUnit != null) {
            const totalAmount = quantity * pricePerUnit;
            Form.getAttribute("cr62c_mon_total_amount").setValue(totalAmount);
        } else {
            Form.getAttribute("cr62c_mon_total_amount").setValue(null);
        }
    } else {
        console.error("Quantity or Price Per Unit fields are missing.");
        Xrm.Navigation.openAlertDialog({text: "Unable to calculate Total Amount. Please ensure Quantity and Price Per Unit fields exist."});
    }
}

function toggleFieldsBasedOnFormType(executionContext) {
    let Form = executionContext.getFormContext();

    let formType = Form.ui.getFormType();

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