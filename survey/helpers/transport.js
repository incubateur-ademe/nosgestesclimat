export const getSituationForTransport = (type, km, usager) => {
    return {
        "transport . deux roues . type": `"${type}"`,
        "transport . deux roues . km": km,
        "transport . deux roues . usager": usager
    };
};
