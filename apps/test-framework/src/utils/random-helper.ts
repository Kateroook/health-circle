import { faker } from '@faker-js/faker';
import { nanoid } from 'nanoid';

export class RandomHelper {
    shortId (length = 8){
        return nanoid(length);
    }

    firstName(){
        return faker.person.firstName();
    }

    lastName(){
        return faker.person.lastName();
    }

    middleName(){
        return faker.person.middleName();
    }

    email({
        prefix = 'test', 
        domain='gmail.com',
    } : {
        prefix?: string, 
        domain?: string,
    } = {}){
        return `${prefix}${nanoid(5)}@${domain}`;
    }

    phone(){
        return faker.phone.number({style: 'international'});
    }

    groupName(){
        return `${faker.company.name}`
    }

    alias({count = 1}){
        return faker.word.words(count);
    }

    number({min = 1, max = 100}){
        return faker.number.bigInt({
            min: min,
            max: max,
        });
    }

    pick<T>(array: T[]): T{
        return faker.helpers.arrayElement(array);
    }
}