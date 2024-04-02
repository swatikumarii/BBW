# Prerequisite

## System Object Type
 - **ProductLineItem**
    - Create custom attribute **greetingCardMessage**

[comment]: <> (Create custom attribute **greetingCardMessage** in **ProductLineItem** System Object Type)

## Create Custom Preferences

##### Greeting card 
- **ID**: isGreetingCardEnable
- **Value Type**: Boolean
- **Help Text**: This attribute help us to enable or disable greeting card functionality on storefront. If true than only enable else disable.

##### Greeting Card Message Limit
- **ID**: greetingCardMessageLimit
- **Value Type**: Integer
- **Help Text**: This attribute help to set max limit of greeting card message
- **Default Value**: 240

##### Greeting Card Category Name
- **ID**: greetingCardCategoryName
- **Value Type**: String
- **Help Text**: This attribute uses for greeting card configurable.
- **Default Value**: greetingCards
