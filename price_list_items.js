async function autofillCurrencyFromPriceList(executionContext) {
    let formContext = executionContext.getFormContext();
    let priceList = formContext.getAttribute("cr62c_fk_price_list").getValue();

    if (priceList) {
        let priceListId = priceList[0].id;

        let priceListRecord = await Xrm.WebApi.retrieveRecord("cr62c_fk_price_list", priceListId, "?$select=transactioncurrencyid");

        if (priceListRecord.transactioncurrencyid) {
            let currencyId = priceListRecord.transactioncurrencyid.transactioncurrencyid;
            let currencyName = priceListRecord.transactioncurrencyid.name;

            formContext.getAttribute("transactioncurrencyid").setValue([{
                id: currencyId,
                name: currencyName,
                entityType: "transactioncurrency"
            }]);

            formContext.getControl("transactioncurrencyid").setDisabled(true);
        }
    }
}

function autofillNameFromProduct(executionContext) {
    let formContext = executionContext.getFormContext();

    let productLookupValue = formContext.getAttribute("cr62c_fk_product").getValue();

    if (productLookupValue != null && productLookupValue.length > 0) {
        let productName = productLookupValue[0].name;

        formContext.getAttribute("cr62c_name").setValue(productName);
    } else {
        formContext.getAttribute("cr62c_name").setValue(null);
    }
}
