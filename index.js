const COMMENT_REGEX = /(--.*)|(\[-(.|\n)+?-\])/g;
const INGREDIENT_REGEX = /@(?:([^@#~]+?)(?:{(.*?)}|{}))|@(.+?\b)/;
const COOKWARE_REGEX = /#(?:([^@#~]+?)(?:{}))|#(.+?\b)/;
const TIMER_REGEX = /~{([0-9]+(?:\/[0-9]+)?)%(.+?)}/;
const METADATA_REGEX = /^>>\s*(.*?):\s*(.*)$/;
// a base class containing the raw string
class base {
    constructor(s) {
        if (s instanceof Array)
            this.raw = s[0];
        else
            this.raw = s;
    }
}
// ingredients
export class Ingredient extends base {
    constructor(s) {
        var _a;
        super(s);
        const match = s instanceof Array ? s : INGREDIENT_REGEX.exec(s);
        if (!match || match.length != 4)
            throw `error parsing ingredient: '${s}'`;
        this.name = (match[1] || match[3]).trim();
        const attrs = (_a = match[2]) === null || _a === void 0 ? void 0 : _a.split('%');
        this.amount = attrs && attrs.length > 0 ? attrs[0].trim() : null;
        this.unit = attrs && attrs.length > 1 ? attrs[1].trim() : null;
    }
}
// cookware
export class Cookware extends base {
    constructor(s) {
        super(s);
        const match = s instanceof Array ? s : COOKWARE_REGEX.exec(s);
        if (!match || match.length != 3)
            throw `error parsing cookware: '${s}'`;
        this.name = (match[1] || match[2]).trim();
    }
}
// timer
export class Timer extends base {
    constructor(s) {
        super(s);
        const match = s instanceof Array ? s : TIMER_REGEX.exec(s);
        if (!match || match.length != 3)
            throw `error parsing timer: '${s}'`;
        this.amount = match[1].trim();
        this.unit = match[2].trim();
        this.seconds = Timer.parseTime(this.amount, this.unit);
    }
    static parseTime(s, unit = 'm') {
        let time = 0;
        let amount = 0;
        if (parseFloat(s) + '' == s)
            amount = parseFloat(s);
        else if (s.includes('/')) {
            const split = s.split('/');
            if (split.length == 2) {
                const num = parseFloat(split[0]);
                const den = parseFloat(split[1]);
                if (num + '' == split[0] && den + '' == split[1]) {
                    amount = num / den;
                }
            }
        }
        if (amount > 0) {
            if (unit.toLowerCase().startsWith('s')) {
                time = amount;
            }
            else if (unit.toLowerCase().startsWith('m')) {
                time = amount * 60;
            }
            else if (unit.toLowerCase().startsWith('h')) {
                time = amount * 60 * 60;
            }
        }
        return time;
    }
}
// metadata
export class Metadata extends base {
    constructor(s) {
        super(s);
        const match = s instanceof Array ? s : METADATA_REGEX.exec(s);
        if (!match || match.length != 3)
            throw `error parsing metadata: '${s}'`;
        this.key = match[1].trim();
        this.value = match[2].trim();
    }
}
// a single recipe step
export class Step extends base {
    constructor(s) {
        super(s);
        this.line = [];
        this.line = this.parseLine(s);
    }
    // parse a single line
    parseLine(s) {
        let match;
        let b;
        let line = [];
        // if the line is blank, return an empty line
        if (s.trim().length === 0)
            return [];
        // if it's a metadata line, return that
        else if (match = METADATA_REGEX.exec(s)) {
            return [new Metadata(match)];
        }
        // if it has an ingredient, pull that out
        else if (match = INGREDIENT_REGEX.exec(s)) {
            b = new Ingredient(match);
        }
        // if it has an item of cookware, pull that out
        else if (match = COOKWARE_REGEX.exec(s)) {
            b = new Cookware(match);
        }
        // if it has a timer, pull that out
        else if (match = TIMER_REGEX.exec(s)) {
            b = new Timer(match);
        }
        // if we found something (ingredient, cookware, timer)
        if (b) {
            // split the string up to get the string left and right of what we found
            const split = s.split(b.raw);
            // if the line doesn't start with what we matched, we need to parse the left side
            if (!s.startsWith(b.raw))
                line.unshift(...this.parseLine(split[0]));
            // add what we matched in the middle
            line.push(b);
            // if the line doesn't end with what we matched, we need to parse the right side
            if (!s.endsWith(b.raw))
                line.push(...this.parseLine(split[1]));
            return line;
        }
        // if it doesn't match any regular expressions, just return the whole string
        return [s];
    }
}
export class Recipe extends base {
    constructor(s) {
        var _a, _b;
        super(s);
        this.metadata = [];
        this.ingredients = [];
        this.cookware = [];
        this.timers = [];
        this.steps = [];
        (_b = (_a = s === null || s === void 0 ? void 0 : s.replace(COMMENT_REGEX, '')) === null || _a === void 0 ? void 0 : _a.split('\n')) === null || _b === void 0 ? void 0 : _b.forEach(line => {
            let l = new Step(line);
            if (l.line.length != 0) {
                if (l.line.length == 1 && l.line[0] instanceof Metadata) {
                    this.metadata.push(l.line[0]);
                }
                else {
                    l.line.forEach(b => {
                        if (b instanceof Ingredient)
                            this.ingredients.push(b);
                        else if (b instanceof Cookware)
                            this.cookware.push(b);
                        else if (b instanceof Timer)
                            this.timers.push(b);
                    });
                    this.steps.push(l);
                }
            }
        });
    }
    calculateTotalTime() {
        return this.timers.reduce((a, b) => a + b.seconds, 0);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLGFBQWEsR0FBRywwQkFBMEIsQ0FBQTtBQUNoRCxNQUFNLGdCQUFnQixHQUFHLHdDQUF3QyxDQUFBO0FBQ2pFLE1BQU0sY0FBYyxHQUFHLGdDQUFnQyxDQUFBO0FBQ3ZELE1BQU0sV0FBVyxHQUFHLGdDQUFnQyxDQUFBO0FBQ3BELE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFBO0FBRTdDLHlDQUF5QztBQUN6QyxNQUFNLElBQUk7SUFHUixZQUFZLENBQW9CO1FBQzlCLElBQUksQ0FBQyxZQUFZLEtBQUs7WUFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7WUFDbkMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUE7SUFDbkIsQ0FBQztDQUNGO0FBRUQsY0FBYztBQUNkLE1BQU0sT0FBTyxVQUFXLFNBQVEsSUFBSTtJQUtsQyxZQUFZLENBQW9COztRQUM5QixLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDUixNQUFNLEtBQUssR0FBRyxDQUFDLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUMvRCxJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQztZQUFFLE1BQU0sOEJBQThCLENBQUMsR0FBRyxDQUFBO1FBQ3pFLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDekMsTUFBTSxLQUFLLEdBQUcsTUFBQSxLQUFLLENBQUMsQ0FBQyxDQUFDLDBDQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNsQyxJQUFJ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LENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLFFBQVEsRUFBRTtvQkFDdkQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO2lCQUM5QjtxQkFDSTtvQkFDSCxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFDakIsSUFBSSxDQUFDLFlBQVksVUFBVTs0QkFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTs2QkFDaEQsSUFBSSxDQUFDLFlBQVksUUFBUTs0QkFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTs2QkFDaEQsSUFBSSxDQUFDLFlBQVksS0FBSzs0QkFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDbEQsQ0FBQyxDQUFDLENBQUE7b0JBQ0YsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ3BCO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxrQkFBa0I7UUFDaEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQ3ZELENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IENPTU1FTlRfUkVHRVggPSAvKC0tLiopfChcXFstKC58XFxuKSs/LVxcXSkvZ1xyXG5jb25zdCBJTkdSRURJRU5UX1JFR0VYID0gL0AoPzooW15AI35dKz8pKD86eyguKj8pfXx7fSkpfEAoLis/XFxiKS9cclxuY29uc3QgQ09PS1dBUkVfUkVHRVggPSAvIyg/OihbXkAjfl0rPykoPzp7fSkpfCMoLis/XFxiKS9cclxuY29uc3QgVElNRVJfUkVHRVggPSAvfnsoWzAtOV0rKD86XFwvWzAtOV0rKT8pJSguKz8pfS9cclxuY29uc3QgTUVUQURBVEFfUkVHRVggPSAvXj4+XFxzKiguKj8pOlxccyooLiopJC9cclxuXHJcbi8vIGEgYmFzZSBjbGFzcyBjb250YWluaW5nIHRoZSByYXcgc3RyaW5nXHJcbmNsYXNzIGJhc2Uge1xyXG4gIHJhdzogc3RyaW5nXHJcblxyXG4gIGNvbnN0cnVjdG9yKHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XHJcbiAgICBpZiAocyBpbnN0YW5jZW9mIEFycmF5KSB0aGlzLnJhdyA9IHNbMF07XHJcbiAgICBlbHNlIHRoaXMucmF3ID0gc1xyXG4gIH1cclxufVxyXG5cclxuLy8gaW5ncmVkaWVudHNcclxuZXhwb3J0IGNsYXNzIEluZ3JlZGllbnQgZXh0ZW5kcyBiYXNlIHtcclxuICBuYW1lOiBzdHJpbmdcclxuICBhbW91bnQ6IHN0cmluZ1xyXG4gIHVuaXQ6IHN0cmluZ1xyXG5cclxuICBjb25zdHJ1Y3RvcihzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xyXG4gICAgc3VwZXIocylcclxuICAgIGNvbnN0IG1hdGNoID0gcyBpbnN0YW5jZW9mIEFycmF5ID8gcyA6IElOR1JFRElFTlRfUkVHRVguZXhlYyhzKVxyXG4gICAgaWYgKCFtYXRjaCB8fCBtYXRjaC5sZW5ndGggIT0gNCkgdGhyb3cgYGVycm9yIHBhcnNpbmcgaW5ncmVkaWVudDogJyR7c30nYFxyXG4gICAgdGhpcy5uYW1lID0gKG1hdGNoWzFdIHx8IG1hdGNoWzNdKS50cmltKClcclxuICAgIGNvbnN0IGF0dHJzID0gbWF0Y2hbMl0/LnNwbGl0KCclJylcclxuICAgIHRoaXMuYW1vdW50ID0gYXR0cnMgJiYgYXR0cnMubGVuZ3RoID4gMCA/IGF0dHJzWzBdLnRyaW0oKSA6IG51bGxcclxuICAgIHRoaXMudW5pdCA9IGF0dHJzICYmIGF0dHJzLmxlbmd0aCA+IDEgPyBhdHRyc1sxXS50cmltKCkgOiBudWxsXHJcbiAgfVxyXG59XHJcblxyXG4vLyBjb29rd2FyZVxyXG5leHBvcnQgY2xhc3MgQ29va3dhcmUgZXh0ZW5kcyBiYXNlIHtcclxuICBuYW1lOiBzdHJpbmdcclxuXHJcbiAgY29uc3RydWN0b3Ioczogc3RyaW5nIHwgc3RyaW5nW10pIHtcclxuICAgIHN1cGVyKHMpXHJcbiAgICBjb25zdCBtYXRjaCA9IHMgaW5zdGFuY2VvZiBBcnJheSA/IHMgOiBDT09LV0FSRV9SRUdFWC5leGVjKHMpXHJcbiAgICBpZiAoIW1hdGNoIHx8IG1hdGNoLmxlbmd0aCAhPSAzKSB0aHJvdyBgZXJyb3IgcGFyc2luZyBjb29rd2FyZTogJyR7c30nYFxyXG4gICAgdGhpcy5uYW1lID0gKG1hdGNoWzFdIHx8IG1hdGNoWzJdKS50cmltKClcclxuICB9XHJcbn1cclxuXHJcbi8vIHRpbWVyXHJcbmV4cG9ydCBjbGFzcyBUaW1lciBleHRlbmRzIGJhc2Uge1xyXG4gIGFtb3VudDogc3RyaW5nXHJcbiAgdW5pdDogc3RyaW5nXHJcbiAgc2Vjb25kczogbnVtYmVyXHJcblxyXG4gIGNvbnN0cnVjdG9yKHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XHJcbiAgICBzdXBlcihzKVxyXG4gICAgY29uc3QgbWF0Y2ggPSBzIGluc3RhbmNlb2YgQXJyYXkgPyBzIDogVElNRVJfUkVHRVguZXhlYyhzKVxyXG4gICAgaWYgKCFtYXRjaCB8fCBtYXRjaC5sZW5ndGggIT0gMykgdGhyb3cgYGVycm9yIHBhcnNpbmcgdGltZXI6ICcke3N9J2BcclxuICAgIHRoaXMuYW1vdW50ID0gbWF0Y2hbMV0udHJpbSgpXHJcbiAgICB0aGlzLnVuaXQgPSBtYXRjaFsyXS50cmltKClcclxuICAgIHRoaXMuc2Vjb25kcyA9IFRpbWVyLnBhcnNlVGltZSh0aGlzLmFtb3VudCwgdGhpcy51bml0KTtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBwYXJzZVRpbWUoczogc3RyaW5nLCB1bml0OiBzdHJpbmcgPSAnbScpIHtcclxuICAgIGxldCB0aW1lID0gMDtcclxuICAgIGxldCBhbW91bnQ6IG51bWJlciA9IDA7XHJcbiAgICBpZiAocGFyc2VGbG9hdChzKSArICcnID09IHMpIGFtb3VudCA9IHBhcnNlRmxvYXQocyk7XHJcbiAgICBlbHNlIGlmIChzLmluY2x1ZGVzKCcvJykpIHtcclxuICAgICAgY29uc3Qgc3BsaXQgPSBzLnNwbGl0KCcvJyk7XHJcbiAgICAgIGlmIChzcGxpdC5sZW5ndGggPT0gMikge1xyXG4gICAgICAgIGNvbnN0IG51bSA9IHBhcnNlRmxvYXQoc3BsaXRbMF0pO1xyXG4gICAgICAgIGNvbnN0IGRlbiA9IHBhcnNlRmxvYXQoc3BsaXRbMV0pO1xyXG4gICAgICAgIGlmIChudW0gKyAnJyA9PSBzcGxpdFswXSAmJiBkZW4gKyAnJyA9PSBzcGxpdFsxXSkge1xyXG4gICAgICAgICAgYW1vdW50ID0gbnVtIC8gZGVuO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChhbW91bnQgPiAwKSB7XHJcbiAgICAgIGlmICh1bml0LnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgncycpKSB7XHJcbiAgICAgICAgdGltZSA9IGFtb3VudDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICh1bml0LnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnbScpKSB7XHJcbiAgICAgICAgdGltZSA9IGFtb3VudCAqIDYwO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKHVuaXQudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdoJykpIHtcclxuICAgICAgICB0aW1lID0gYW1vdW50ICogNjAgKiA2MDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aW1lO1xyXG4gIH1cclxufVxyXG5cclxuLy8gbWV0YWRhdGFcclxuZXhwb3J0IGNsYXNzIE1ldGFkYXRhIGV4dGVuZHMgYmFzZSB7XHJcbiAga2V5OiBzdHJpbmdcclxuICB2YWx1ZTogc3RyaW5nXHJcblxyXG4gIGNvbnN0cnVjdG9yKHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XHJcbiAgICBzdXBlcihzKVxyXG4gICAgY29uc3QgbWF0Y2ggPSBzIGluc3RhbmNlb2YgQXJyYXkgPyBzIDogTUVUQURBVEFfUkVHRVguZXhlYyhzKVxyXG4gICAgaWYgKCFtYXRjaCB8fCBtYXRjaC5sZW5ndGggIT0gMykgdGhyb3cgYGVycm9yIHBhcnNpbmcgbWV0YWRhdGE6ICcke3N9J2BcclxuICAgIHRoaXMua2V5ID0gbWF0Y2hbMV0udHJpbSgpXHJcbiAgICB0aGlzLnZhbHVlID0gbWF0Y2hbMl0udHJpbSgpXHJcbiAgfVxyXG59XHJcblxyXG4vLyBhIHNpbmdsZSByZWNpcGUgc3RlcFxyXG5leHBvcnQgY2xhc3MgU3RlcCBleHRlbmRzIGJhc2Uge1xyXG4gIGxpbmU6IChzdHJpbmcgfCBiYXNlKVtdID0gW11cclxuICBpbWFnZT86IGFueVxyXG5cclxuICBjb25zdHJ1Y3RvcihzOiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKHMpXHJcbiAgICB0aGlzLmxpbmUgPSB0aGlzLnBhcnNlTGluZShzKVxyXG4gIH1cclxuXHJcbiAgLy8gcGFyc2UgYSBzaW5nbGUgbGluZVxyXG4gIHBhcnNlTGluZShzOiBzdHJpbmcpOiAoc3RyaW5nIHwgYmFzZSlbXSB7XHJcbiAgICBsZXQgbWF0Y2g6IHN0cmluZ1tdXHJcbiAgICBsZXQgYjogYmFzZVxyXG4gICAgbGV0IGxpbmU6IChzdHJpbmcgfCBiYXNlKVtdID0gW11cclxuICAgIC8vIGlmIHRoZSBsaW5lIGlzIGJsYW5rLCByZXR1cm4gYW4gZW1wdHkgbGluZVxyXG4gICAgaWYgKHMudHJpbSgpLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtdXHJcbiAgICAvLyBpZiBpdCdzIGEgbWV0YWRhdGEgbGluZSwgcmV0dXJuIHRoYXRcclxuICAgIGVsc2UgaWYgKG1hdGNoID0gTUVUQURBVEFfUkVHRVguZXhlYyhzKSkge1xyXG4gICAgICByZXR1cm4gW25ldyBNZXRhZGF0YShtYXRjaCldXHJcbiAgICB9XHJcbiAgICAvLyBpZiBpdCBoYXMgYW4gaW5ncmVkaWVudCwgcHVsbCB0aGF0IG91dFxyXG4gICAgZWxzZSBpZiAobWF0Y2ggPSBJTkdSRURJRU5UX1JFR0VYLmV4ZWMocykpIHtcclxuICAgICAgYiA9IG5ldyBJbmdyZWRpZW50KG1hdGNoKVxyXG4gICAgfVxyXG4gICAgLy8gaWYgaXQgaGFzIGFuIGl0ZW0gb2YgY29va3dhcmUsIHB1bGwgdGhhdCBvdXRcclxuICAgIGVsc2UgaWYgKG1hdGNoID0gQ09PS1dBUkVfUkVHRVguZXhlYyhzKSkge1xyXG4gICAgICBiID0gbmV3IENvb2t3YXJlKG1hdGNoKVxyXG4gICAgfVxyXG4gICAgLy8gaWYgaXQgaGFzIGEgdGltZXIsIHB1bGwgdGhhdCBvdXRcclxuICAgIGVsc2UgaWYgKG1hdGNoID0gVElNRVJfUkVHRVguZXhlYyhzKSkge1xyXG4gICAgICBiID0gbmV3IFRpbWVyKG1hdGNoKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGlmIHdlIGZvdW5kIHNvbWV0aGluZyAoaW5ncmVkaWVudCwgY29va3dhcmUsIHRpbWVyKVxyXG4gICAgaWYgKGIpIHtcclxuICAgICAgLy8gc3BsaXQgdGhlIHN0cmluZyB1cCB0byBnZXQgdGhlIHN0cmluZyBsZWZ0IGFuZCByaWdodCBvZiB3aGF0IHdlIGZvdW5kXHJcbiAgICAgIGNvbnN0IHNwbGl0ID0gcy5zcGxpdChiLnJhdylcclxuICAgICAgLy8gaWYgdGhlIGxpbmUgZG9lc24ndCBzdGFydCB3aXRoIHdoYXQgd2UgbWF0Y2hlZCwgd2UgbmVlZCB0byBwYXJzZSB0aGUgbGVmdCBzaWRlXHJcbiAgICAgIGlmICghcy5zdGFydHNXaXRoKGIucmF3KSkgbGluZS51bnNoaWZ0KC4uLnRoaXMucGFyc2VMaW5lKHNwbGl0WzBdKSlcclxuICAgICAgLy8gYWRkIHdoYXQgd2UgbWF0Y2hlZCBpbiB0aGUgbWlkZGxlXHJcbiAgICAgIGxpbmUucHVzaChiKVxyXG4gICAgICAvLyBpZiB0aGUgbGluZSBkb2Vzbid0IGVuZCB3aXRoIHdoYXQgd2UgbWF0Y2hlZCwgd2UgbmVlZCB0byBwYXJzZSB0aGUgcmlnaHQgc2lkZVxyXG4gICAgICBpZiAoIXMuZW5kc1dpdGgoYi5yYXcpKSBsaW5lLnB1c2goLi4udGhpcy5wYXJzZUxpbmUoc3BsaXRbMV0pKVxyXG5cclxuICAgICAgcmV0dXJuIGxpbmVcclxuICAgIH1cclxuICAgIC8vIGlmIGl0IGRvZXNuJ3QgbWF0Y2ggYW55IHJlZ3VsYXIgZXhwcmVzc2lvbnMsIGp1c3QgcmV0dXJuIHRoZSB3aG9sZSBzdHJpbmdcclxuICAgIHJldHVybiBbc11cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBSZWNpcGUgZXh0ZW5kcyBiYXNlIHtcclxuICBtZXRhZGF0YTogTWV0YWRhdGFbXSA9IFtdXHJcbiAgaW5ncmVkaWVudHM6IEluZ3JlZGllbnRbXSA9IFtdXHJcbiAgY29va3dhcmU6IENvb2t3YXJlW10gPSBbXVxyXG4gIHRpbWVyczogVGltZXJbXSA9IFtdXHJcbiAgc3RlcHM6IFN0ZXBbXSA9IFtdXHJcbiAgaW1hZ2U/OiBhbnlcclxuXHJcbiAgY29uc3RydWN0b3Iocz86IHN0cmluZykge1xyXG4gICAgc3VwZXIocylcclxuICAgIHM/LnJlcGxhY2UoQ09NTUVOVF9SRUdFWCwgJycpPy5zcGxpdCgnXFxuJyk/LmZvckVhY2gobGluZSA9PiB7XHJcbiAgICAgIGxldCBsID0gbmV3IFN0ZXAobGluZSk7XHJcbiAgICAgIGlmIChsLmxpbmUubGVuZ3RoICE9IDApIHtcclxuICAgICAgICBpZiAobC5saW5lLmxlbmd0aCA9PSAxICYmIGwubGluZVswXSBpbnN0YW5jZW9mIE1ldGFkYXRhKSB7XHJcbiAgICAgICAgICB0aGlzLm1ldGFkYXRhLnB1c2gobC5saW5lWzBdKVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGwubGluZS5mb3JFYWNoKGIgPT4ge1xyXG4gICAgICAgICAgICBpZiAoYiBpbnN0YW5jZW9mIEluZ3JlZGllbnQpIHRoaXMuaW5ncmVkaWVudHMucHVzaChiKVxyXG4gICAgICAgICAgICBlbHNlIGlmIChiIGluc3RhbmNlb2YgQ29va3dhcmUpIHRoaXMuY29va3dhcmUucHVzaChiKVxyXG4gICAgICAgICAgICBlbHNlIGlmIChiIGluc3RhbmNlb2YgVGltZXIpIHRoaXMudGltZXJzLnB1c2goYilcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICB0aGlzLnN0ZXBzLnB1c2gobCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgY2FsY3VsYXRlVG90YWxUaW1lKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudGltZXJzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIuc2Vjb25kcywgMClcclxuICB9XHJcbn0iXX0=