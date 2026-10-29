const fs = require('fs');

let file = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `            </form>
          </div>
        </div>
      </section>`;

const replacement = `            </form>
            </div>
          </div>
        </div>
      </section>`;

if (file.includes(target)) {
  file = file.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', file);
  console.log('Fixed div');
} else {
  console.log('Target not found');
}
