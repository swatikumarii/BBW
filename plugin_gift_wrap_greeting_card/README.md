# Objective

Add greeting card with cart if we want to gift to receiver.

# How to use this cartridges

- Follow [Prerequisite](https://git.ranosys.org/ranosys/bath-and-body-works/-/blob/BBW-24/plugin_gift_wrap_greeting_card/README.md#prerequisite)
- Create a Category for Greeting Cards
- Add Greeting card products in this Category
- Add Category name in **greetingCardCategoryName** custom preference

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
