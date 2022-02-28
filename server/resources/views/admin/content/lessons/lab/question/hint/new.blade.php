@include('include.header')

	 <section class="section">
		 <div class="container">
		 <p>
		 {{$question->question}}
		 </p>
			<form method="POST" action="{{route('admin-create-lab-lesson-question-hints',['question_id' => $question->id])}}">
			@csrf
				<div class="field">
				  <label class="label">Hint</label>
				  <div class="control">
					<textarea class="textarea" placeholder="Textarea" name="hint"></textarea>
				  </div>
				</div> 

				<div class="field">
				  <label class="label">Price</label>
				  <div class="control">
						<input class="input" type="text" placeholder="100" name="price" value="100">
				  </div>
				</div>
				<div class="field">
				  <div class="control">
					<button class="button is-success">Save</button>
				  </div>
				</div>
			</form>
		</div>
    </section>


@include('include.footer')