<results-table>
    <div class="row">
        <div id="results" class="small-12 medium-8 medium-offset-2 columns">
            <div each={ result in results } class="result { index == 0 ? 'best' : 'runner-up' }">
                <p if={ index == 0 }>
                    Best match
                </p>
                <p if={ index == 1 && results.length > 1 }>
                    Runners up
                </p>
                <div class="inner">
                    { label }
                    <span class="confidence">{ value.toFixed(4) }</span>
                </div>
            </div>
            <div if={ !results } class="result best">
                <div class="inner none">
                    no results found.
                </div>
            </div>
        </div>
    </div>

    <script>
        var self = this;

        self.on('mount', function(){
            var relevantResults = [];

            self.opts.results.map(function(result, i){
                result.index = i;
                if (result.value.toFixed(4) != 0.0000){
                    relevantResults.push(result);
                }
            });

            self.results = relevantResults.length > 0 ? relevantResults : null;
            self.update();
        });
    </script>
</results-table>