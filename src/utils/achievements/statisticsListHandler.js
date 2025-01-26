export const handleInputChange = (name, value, setNewStatValues) => {
    const numericalValue = value.replace(/\D/g, '');
    setNewStatValues(prevValues => ({
        ...prevValues,
        [name]: numericalValue
    }));
};
