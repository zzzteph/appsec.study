<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTheoryLessonsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('theory_lessons', function (Blueprint $table) {
            $table->id();
			$table->foreignId('lesson_id')->constrained()->onDelete('cascade');;
			$table->string('header',255)->default("");
			$table->text('content')->default("");
			$table->integer('score')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('theory_lessons');
    }
}
