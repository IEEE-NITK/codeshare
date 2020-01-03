class Identifier {
    /**
     * An `Identifier` identifies the position of a `ch` in a `character`
     * @param  {Number} position
     * @param  {Number} siteID
     */
    constructor(position, siteID) {
        this.position = position;
        this.siteID = siteID;
    }
    
    /**
     * If `this` == `identifier`
     * @param  {Identifier} identifier
     * @param  {Boolean}    site=true
     */
    isEqualTo(identifier, site=true) {
        if(site) return (this.position == identifier.position && this.siteID == identifier.siteID);
        else return (this.position == identifier.position);
    }
    
    /**
     * If `this` > `identifier`
     * Based on position, ties broken by siteID
     * @param  {Identifier} identifier
     */
    isGreaterThan(identifier) {
        if(this.position > identifier.position) return true;
        if(this.position < identifier.position) return false;
        return this.siteID > identifier.siteID;
    }

    /**
     * If `this` < `identifier`
     * Based on position, ties broken by siteID
     * @param  {Identifier} identifier
     */
    isLesserThan(identifier) {
        return (!this.isEqualTo(identifier) && !this.isGreaterThan(identifier));;
    }

    /**
     * Get string representation of `Identifier`.
     * Useful for debugging.
     */
    toString() {
        return `[${this.position}, ${this.siteID}]`;
    }
}

/**
 * Converts 2 element list to identifier list
 * @param  {List{List[2]}} list=[]
 * @result {List{Identifiers}}
 */
function createIdentifierList(list = []) {
    var identifierList = []
    for(let l of list) {
        identifierList.push(new Identifier(l[0], l[1]));
    }
    return identifierList;
}

/**
 * Parse identifiers and replace `null` sideID
 * with `Infinity`. (Phoenix converts `Infinity` 
 * to `null`)
 * @param  {List{Identifiers}}
 * @result {List{Identifiers}}
 */
function parseIdentifiers(identifiers) {
    var identifierList = []
    for(let i of identifiers) {
        var temp;
        if(i.siteID == null)
            temp = Infinity;
        else
            temp = i.siteID;
        identifierList.push(new Identifier(i.position, temp))
    }
    return identifierList;
}

//NOTE: Element would be a better name
class Character {
    /**
     * Each `Character` of CRDT data structure
     * @param  {Char}   ch
     * @param  {List{Identifier}} identifiers
     */
    constructor(ch, identifiers) {
        this.ch = ch;
        this.identifiers = identifiers;
    }
    
    /**
     * If `this` == `character`
     * @param  {Character} character
     * @param  {Boolean}   site
     */
    isEqualTo(character, site=true) {
        if(this.ch != character.ch) return false;
        if(this.identifiers.length != character.identifiers.length) return false;
        for(let i = 0; i < this.identifiers.length; i++) {
            var i1 = this.identifiers[i];
            var i2 = character.identifiers[i];
            if(!i1.isEqualTo(i2, site)) {
                return false;
            }
        }
        return true;
    }

    /**
     * If `this` > `character`
     * Based on `identifiers`
     * @param  {Character} character
     */
    isGreaterThan(character) {
        var len = Math.min(this.identifiers.length, character.identifiers.length);
        for(let i = 0; i < len; i++) {
            var i1 = this.identifiers[i];
            var i2 = character.identifiers[i];
            if(i1.isEqualTo(i2)) continue;
            if(i1.isGreaterThan(i2)) return true;
            else return false;
        }
        if(this.identifiers.length > character.identifiers.length) return true;
        else return false;
    }

    /**
     * Pushes `identifier` to `this.identifiers`
     * @param  {Identifer} identifier
     */
    pushIdentifier(identifier) {
        this.identifiers.push(identifier);
    }

    /**
     * Get string representation of `Character`.
     * Useful for debugging.
     */
    toString() {
        var output = `{${this.ch}: [`;
        for(let i = 0; i < this.identifiers.length; i++) {
            output += this.identifiers[i].toString();
            if(i < this.identifiers.length-1)
                output += ', ';
        }
        output += ']}';
        return output;
    }
}

class CRDT {
    /**
     * Conflict-Free Replicated Data Type on each client side
     * @param  {List{Character}} data=[]
     */
    constructor(data = [
            [new Character('', createIdentifierList([[0, -1]])), new Character('', createIdentifierList([[1, Infinity]]))]
        ]) {
        this.data = data;
    }

    /**
     * Find identifierList between `prevIdentifierList` and `nextIdentifierList`
     * @param  {List{Identifier}} prevIdentifierList
     * @param  {List{Identifier}} nextIdentifierList
     * @result {List{Identifier}}
     */
    findNextGreaterIdentifierList(prevIdentifierList, nextIdentifierList, siteID) {
        var maxLen = Math.max(prevIdentifierList.length, nextIdentifierList.length);
        var newIdentifierList = []
        
        //Keep track of siteID before current Identifier
        var lastPrevSiteID = -1;
        var lastNextSiteID = Infinity;

        //Keeps track if the identifierList is found
        var identifierListFound = false;
        //Keeps track if next greater identifier of prev identifier is being found out
        var nextGreaterIdentifierFound = false;

        //Iterate over prev and next Identifier and get IdentifierList of `insertCharacter`
        for(let i = 0; i < maxLen; i++) {
            //TODO: Check this
            var prevIdentifier = ((i < prevIdentifierList.length) ? prevIdentifierList[i] : new Identifier(0, lastPrevSiteID));
            var nextIdentifier = ((i < nextIdentifierList.length) ? nextIdentifierList[i] : new Identifier(0, lastNextSiteID));
            
            if(!nextGreaterIdentifierFound) {
                if(prevIdentifier.position < nextIdentifier.position) {
                    //Being greedy on size of identifier list
                    if(siteID > prevIdentifier.siteID && prevIdentifier.siteID != -1) { //TODO: check if ch is same? idempotency?
                        //If by siteID alone identifier order can be obtained, then push and done!
                        //Edge case of first character inserted in line handled by 2nd condition
                        newIdentifierList.push(new Identifier(prevIdentifier.position, siteID));
                        identifierListFound = true;
                    }
                    else if(prevIdentifier.positon + 1 < nextIdentifier.position) {
                        //If there is atleast a gap of 2 between prevIdentifier and nextIdentifier, take
                        //prevIdentifier.position+1 and done!
                        newIdentifierList.push(new Identifier(prevIdentifier.position+1, siteID));
                        identifierListFound = true;
                    }
                    else { //prevIdentifier.position + 1 == nextIdentifier.position
                        //IdentifierList lesser than nextIndentifierList is found;
                        //Next find IdentifierList greater than prevIdentifier
                        newIdentifierList.push(new Identifier(prevIdentifier.position, prevIdentifier.siteID));
                        nextGreaterIdentifierFound = true;
                    }
                }
                else { //prevIdentifier.position == nextIdentifer.position
                    //NOTE: prevIdentifier.siteID < nextIdentifier.siteID
                    if(prevIdentifier.siteID < siteID && siteID < nextIdentifier.siteID) {
                        //By siteID alone order can be obtained, then push and done!
                        newIdentifierList.push(new Identifier(prevIdentifier.position, siteID));
                        identifierListFound = true;
                    }
                    else {
                        //Positions are same and siteIDs don't help in ordering. Have to go ahead
                        newIdentifierList.push(new Identifier(prevIdentifier.position, prevIdentifier.siteID));
                    }
                }
            }
            else {
                //IdentifierList is already less then nextIdentifierList;
                //This section finds IdentifierList greater than prevIdentifierList
                if(siteID > prevIdentifier.siteID) {
                    //By siteId alone order can be obtained, then push and done!
                    newIdentifierList.push(new Identifier(prevIdentifier.position, siteID));
                    identifierListFound = true;
                }
                else if(prevIdentifier.position < 9) {
                    //If prevIdentifier.position is not 9, then can always add 1 to position, push and done!
                    newIdentifierList.push(new Identifier(prevIdentifier.position+1, siteID));
                    identifierListFound = true;
                }
                else { //prevIdentifier.position == 9
                    //If prevIdentifier.position is 9, then have to go ahead
                    newIdentifierList.push(new Identifier(prevIdentifier.position, prevIdentifier.siteID));
                }
            }

            lastPrevSiteID = prevIdentifier.siteID;
            lastNextSiteID = nextIdentifier.siteID;

            if(identifierListFound) break;
        }

        if(!identifierListFound) {
            newIdentifierList.push(new Identifier(1, siteID));
            identifierListFound = true;
        }

        return newIdentifierList;
    }

    /**
     * Insert `ch` at line `lineNumber` and position `pos` by `siteID`
     * Enters at `pos`, characters after `pos` are shifted ahead
     * @param  {Char}   ch
     * @param  {Number} lineNumber
     * @param  {Number} pos
     * @param  {Number} siteID
     * @result {Character}
     */
    localInsert(ch, lineNumber, pos, siteID) {

        pos = pos + 1;
        var prevIdentifierList = this.data[lineNumber][pos-1].identifiers;
        var nextIdentifierList = this.data[lineNumber][pos].identifiers;
        
        var insertCharacter = new Character(ch, this.findNextGreaterIdentifierList(prevIdentifierList, nextIdentifierList, siteID));

        //insert new Character to CRDT and return it
        this.data[lineNumber].splice(pos, 0, insertCharacter);
        return insertCharacter;
    }

     /**
     * Delete `character` at line `lineNumber` and position `pos`
     * @param  {Number} lineNumber
     * @param  {Number} pos
     * @result {Character}
     */
    localDelete(lineNumber, pos) {
        pos = pos + 1;
        var tempCharacter = this.data[lineNumber][pos];
        this.data[lineNumber].splice(pos, 1);
        return tempCharacter;
    }

    /**
     * Insert a newline character int line `lineNumber` and at position `pos`
     * @param  {Number} lineNumber
     * @param  {Number} pos
     * @result {Character}
     */
    localInsertNewline(lineNumber, pos) {
        pos = pos + 1;

        var prevIdentifierList = this.data[lineNumber][pos-1].identifiers;
        var nextIndentifierList = this.data[lineNumber][pos].identifiers;
    
        //find the next greater identifier list which becomes the identifier list for the newline characters
        var newIdentifierList = this.findNextGreaterIdentifierList(prevIdentifierList, nextIndentifierList, -1);
        var beginCharacter = new Character('', newIdentifierList);
        var endCharacter = new Character('', newIdentifierList);

        //insert the newline character
        this.data.splice(lineNumber+1, 0, this.data[lineNumber].splice(pos));
        this.data[lineNumber].push(endCharacter);
        this.data[lineNumber+1].unshift(beginCharacter);
        
        //return the newline character generated
        return beginCharacter;
    }

    /**
     * Deletes new line at the end of line `lineNumber`.
     * Merges line `lineNumber+1` at the end of `lineNumber`
     * @param  {Number} lineNumber
     * @result {Character} endCharacter
     */
    localDeleteNewline(lineNumber) {
        var endCharacter = this.data[lineNumber].pop();

        //Remove line `lineNumber+1
        var lineToMerge = this.data.splice(lineNumber+1, 1)[0];
        //Remove 'starting' character from line to be merged
        lineToMerge.shift();
        //Merge `lineToMerge` to line `lineNumber` by offseting each character in `lineToMerge`
        for(var character of lineToMerge) {
            var modifiedCharacter = character;
            this.data[lineNumber].push(modifiedCharacter);
        }
        //return the character removed
        return endCharacter;
    }

    /**
     * Insert `character` in the CRDT structure
     * @param {Character} character 
     * @result {Number} lineNumber
     */
    remoteInsert(character) { //Binary search insertion [pointless since splice will be O(n)]
        var charCopy = new Character(character.ch, parseIdentifiers(character.identifiers));
        
        //identify the line in which the character fits by comparing against last character in the lines
        var lineNumber;
        for(lineNumber = 0; lineNumber < this.data.length; lineNumber++) {
            var lineLength = this.data[lineNumber].length;
            //identify the position in the line where the character fits
            if(this.data[lineNumber][lineLength-1].isGreaterThan(charCopy)) {
                var pos;
                for(pos = 0; pos < lineLength; pos++) {
                    var c = this.data[lineNumber][pos];    
                    if(!charCopy.isGreaterThan(c))
                        break;
                }
                this.data[lineNumber].splice(pos, 0, charCopy);
                break;
            }
        }
        //return the line number to update in codemirror
        return lineNumber;
    }

    /**
     * Delete the `character` received from the CRDT structure if present.
     * Returns -1 if character is not deleted (i.e. when already locally deleted)
     * @param {Character} character 
     * @result {Number} lineNumber
     */
    remoteDelete(character) { //Binary search insertion [pointless since splice will be O(n)]
        //Phoenix (server) converts Infinity to `null`. parseIdentifiers handles this
        var charCopy = new Character(character.ch, parseIdentifiers(character.identifiers))
        var isCharDeleted = false;

        //identify the line in which the character is present by comparing against last character in the lines
        var lineNumber;
        for(lineNumber = 0; lineNumber<this.data.length; lineNumber++) {
            var lineLength = this.data[lineNumber].length;
            //identify the position in the line where the character is present
            if(this.data[lineNumber][lineLength-1].isGreaterThan(charCopy)) {
                for(let pos = 0; pos < lineLength; pos++) {
                    var c = this.data[lineNumber][pos];
                    if(c.isEqualTo(charCopy)) {
                        this.data[lineNumber].splice(pos, 1);
                        isCharDeleted = true;
                        break;
                    }
                }
                break;
            }
        }
        //return the line number to update in codemirror
        if(isCharDeleted)
            return lineNumber;
        else
            return -1;
    }

    /**
     * Insert a newline using `character` at its appropriate position in CRDT
     * @param {Character} character 
     * @result {Number} lineNumber
     */
    remoteInsertNewline(character) {
        var charCopy = new Character(character.ch, parseIdentifiers(character.identifiers));
        
        //identify the line an which to insert the newline character by comparing against last character in the lines
        var lineNumber;
        for(lineNumber = 0; lineNumber < this.data.length; lineNumber++) {
            var lineLength = this.data[lineNumber].length;
            //identify the position in the line where the character fits
            if(this.data[lineNumber][lineLength-1].isGreaterThan(charCopy)) {
                var pos;
                for(pos = 0; pos < lineLength; pos++) {
                    var c = this.data[lineNumber][pos];
                    if(!charCopy.isGreaterThan(c))
                        break;
                }
                //create the newline characters
                var beginCharacter = new Character('', parseIdentifiers(charCopy.identifiers));
                var endCharacter = new Character('', parseIdentifiers(charCopy.identifiers));
                //split the line into two
                this.data.splice(lineNumber+1, 0, this.data[lineNumber].splice(pos));
                //insert the newline characters
                this.data[lineNumber].push(endCharacter);
                this.data[lineNumber+1].unshift(beginCharacter);
                break;
            }
        }
        //return the line number to update in codemirror
        return lineNumber;
    }

    /**
     * Delete the newline character `character` in CRDT
     * @param {Character} character 
     * @result {Number} lineNumber
     */
    remoteDeleteNewline(character) {
        //Phoenix (server) converts Infinity to `null`. parseIdentifiers handles this
        var cchar = new Character(character.ch, parseIdentifiers(character.identifiers))
        var isCharDeleted = false;

        //identify the line which has the newline character by comparing against last character in the lines
        var lineNumber;
        for(lineNumber = 0; lineNumber<this.data.length; lineNumber++) {
            var lineLength = this.data[lineNumber].length;
            //identify the position in the line where the character is present
            if(this.data[lineNumber][lineLength-1].isEqualTo(cchar)) {
                this.data[lineNumber].pop();
                //Remove line `lineNumber+1`
                var lineToMerge = this.data.splice(lineNumber+1, 1)[0];
                //Remove 'starting' character from line to be merged
                lineToMerge.shift();
                //Merge `lineToMerge` to line `lineNumber` by offseting each character in `lineToMerge`
                for(var c of lineToMerge) {
                    this.data[lineNumber].push(c);
                }
                isCharDeleted = true;
                break;
            }
            //identify if the newline character has been deleted already or does not exist
            else if(this.data[lineNumber][lineLength-1].isGreaterThan(cchar)) {
                break;
            }
        }
        //return the line number to update in codemirror
        if(isCharDeleted)
            return lineNumber;
        else
            return -1;
    }
    
    /**
     * Converts a line of CRDT into editor compliant line
     * @param  {Number} lineNumber
     */
    getUpdatedLine(lineNumber) {
        var characters = this.data[lineNumber];
        var lineString = ""; 
        for(let c of characters) {
            lineString += c.ch;
        }
        return lineString;
    }

    /**
     * Get string representation of `CRDT`.
     * Useful for debugging.
     */
    toString() {
        var output = "";
        for(let i = 0; i < this.data.length; i++) {
            for(let j = 0; j < this.data[i].length; j++) {
                var character = this.data[i][j];
                output += character.toString();
                if(j < this.data[i].length-1)
                    output += ", "  
            }
            output += "\n"
        }
        return output;
    }
}

var crdt = new CRDT();

export default crdt